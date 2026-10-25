import os
import io
import uuid
import json
from datetime import datetime
from typing import List, Optional, Any, Dict

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Body,
    Request,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database import get_db
from app.models import User, StudyMaterial
from app.models.knowledge_band import KnowledgeBand
from app.models.progress import Progress
from app.auth import get_current_user, require_teacher, require_student
from app.config import settings
from app.services.ai_service import ai_service

router = APIRouter(prefix="/study", tags=["study"])

STORAGE_BUCKET = "study-materials"
LOCAL_MATERIALS_DIR = os.path.join("uploads", "study-materials")
os.makedirs(LOCAL_MATERIALS_DIR, exist_ok=True)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class StudyMaterialCreateJson(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject: Optional[str] = "General"
    topic: Optional[str] = ""
    description: Optional[str] = None
    target_band: Optional[str] = Field("all", description="foundation | on_track | advanced | all")
    knowledge_band_target: Optional[str] = None
    original_content: Optional[str] = None
    material_type: Optional[str] = "Notes"
    tags: Optional[List[str]] = Field(default_factory=list)
    visibility: Optional[str] = "published"


class StudyMaterialUpdateJson(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    target_band: Optional[str] = None
    knowledge_band_target: Optional[str] = None
    original_content: Optional[str] = None
    simplified_content: Optional[str] = None
    material_type: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility: Optional[str] = None


class StudyMaterialResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    author_name: str = "Instructor"
    title: str
    subject: str = "General"
    topic: str = ""
    description: Optional[str] = None
    target_band: str = "all"
    knowledge_band_target: str = "all"
    material_type: str = "Notes"
    structured_content: Dict[str, Any] = Field(default_factory=dict)
    original_content: Optional[str] = None
    simplified_content: Optional[str] = None
    source_file_name: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    visibility: str = "published"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Storage Helpers ──────────────────────────────────────────────────────────

def _get_supabase_client():
    if settings.supabase_url and settings.supabase_key:
        try:
            from supabase import create_client
            client = create_client(settings.supabase_url, settings.supabase_key)
            # Ensure bucket exists
            try:
                client.storage.get_bucket(STORAGE_BUCKET)
            except Exception:
                try:
                    client.storage.create_bucket(STORAGE_BUCKET, options={"public": False})
                except Exception:
                    pass
            return client
        except Exception as e:
            print(f"[StudyRouter] Supabase init info: {e}")
            return None
    return None


def _extract_text(filename: str, content: bytes, content_type: str = "") -> str:
    lower = filename.lower() if filename else ""
    if lower.endswith(".pdf") or "pdf" in content_type:
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = [p.extract_text() for p in reader.pages if p.extract_text()]
            return "\n\n".join(pages)
        except Exception as e:
            print(f"[StudyRouter] PDF extraction error: {e}")
            return ""

    elif lower.endswith(".docx") or "officedocument.wordprocessingml" in content_type:
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            print(f"[StudyRouter] DOCX extraction error: {e}")
            return ""

    # Plain text / Markdown fallback
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _format_study_material(mat: StudyMaterial, author_name: str = "Instructor") -> StudyMaterialResponse:
    target_band = getattr(mat, "knowledge_band_target", None) or "all"
    source_name = getattr(mat, "source_file_name", None) or mat.file_name

    return StudyMaterialResponse(
        id=mat.id,
        user_id=mat.user_id,
        author_name=author_name or "Instructor",
        title=mat.title,
        subject=mat.subject or "General",
        topic=mat.topic or "",
        description=mat.description,
        target_band=target_band,
        knowledge_band_target=target_band,
        material_type=mat.material_type or "Notes",
        structured_content=mat.structured_content or {},
        original_content=mat.original_content,
        simplified_content=mat.simplified_content,
        source_file_name=source_name,
        file_name=mat.file_name,
        file_path=mat.file_path,
        file_type=mat.file_type,
        file_size=mat.file_size,
        tags=mat.tags or [],
        visibility=mat.visibility or "published",
        created_at=mat.created_at,
        updated_at=mat.updated_at,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/materials", response_model=StudyMaterialResponse)
async def create_study_material(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
    # Optional form fields for multipart upload
    title: Optional[str] = Form(None),
    subject: Optional[str] = Form("General"),
    topic: Optional[str] = Form(""),
    description: Optional[str] = Form(None),
    target_band: Optional[str] = Form("all"),
    knowledge_band_target: Optional[str] = Form("all"),
    original_content: Optional[str] = Form(None),
    material_type: Optional[str] = Form("Notes"),
    visibility: Optional[str] = Form("published"),
    tags: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Teacher creates new study material.
    Supports either JSON payload or Multipart Form with PDF / DOCX / TXT upload.
    Automatically extracts text and generates ADHD-friendly student-ready simplified format.
    """
    content_type = request.headers.get("content-type", "")

    mat_title = title
    mat_subject = subject or "General"
    mat_topic = topic or ""
    mat_description = description
    mat_band = knowledge_band_target or target_band or "all"
    mat_type = material_type or "Notes"
    mat_content = original_content
    mat_visibility = visibility or "published"
    mat_tags = []

    # If request is application/json, parse body directly
    if "application/json" in content_type:
        try:
            body_bytes = await request.body()
            body_json = json.loads(body_bytes)
            mat_title = body_json.get("title", mat_title)
            mat_subject = body_json.get("subject", mat_subject)
            mat_topic = body_json.get("topic", mat_topic)
            mat_description = body_json.get("description", mat_description)
            mat_band = body_json.get("knowledge_band_target") or body_json.get("target_band") or mat_band
            mat_type = body_json.get("material_type", mat_type)
            mat_content = body_json.get("original_content", mat_content)
            mat_visibility = body_json.get("visibility", mat_visibility)
            mat_tags = body_json.get("tags", [])
        except Exception as err:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {err}")

    if not mat_title:
        raise HTTPException(status_code=400, detail="Title is required")

    # Parse tags if string provided via form
    if isinstance(tags, str) and tags.strip():
        try:
            mat_tags = json.loads(tags)
        except Exception:
            mat_tags = [t.strip() for t in tags.split(",") if t.strip()]

    material_id = uuid.uuid4()
    file_name = None
    file_path = None
    file_type = None
    file_size = None
    extracted_text = mat_content or ""

    # Process file upload if attached
    if file and file.filename:
        file_name = file.filename
        file_type = file.content_type or "application/octet-stream"
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Local disk fallback storage
        local_dir = os.path.join(LOCAL_MATERIALS_DIR, str(current_user.id), str(material_id))
        os.makedirs(local_dir, exist_ok=True)
        local_filepath = os.path.join(local_dir, file_name)
        with open(local_filepath, "wb") as f:
            f.write(file_bytes)

        # 2. Supabase Storage upload
        supabase = _get_supabase_client()
        storage_key = f"{str(current_user.id)}/{str(material_id)}/{file_name}"
        if supabase:
            try:
                supabase.storage.from_(STORAGE_BUCKET).upload(
                    path=storage_key,
                    file=file_bytes,
                    file_options={"content-type": file_type, "upsert": "true"}
                )
                file_path = f"{STORAGE_BUCKET}/{storage_key}"
            except Exception as e:
                print(f"[StudyRouter] Supabase upload warning: {e}")
                file_path = local_filepath
        else:
            file_path = local_filepath

        # 3. Server-side text extraction
        extracted = _extract_text(file_name, file_bytes, file_type)
        if extracted:
            extracted_text = extracted
        if not mat_type or mat_type == "Notes":
            if file_name.lower().endswith(".pdf"):
                mat_type = "PDF"
            elif file_name.lower().endswith((".doc", ".docx")):
                mat_type = "Document"

    # Create record in database
    material = StudyMaterial(
        id=material_id,
        user_id=current_user.id,
        title=mat_title,
        subject=mat_subject,
        topic=mat_topic,
        description=mat_description,
        material_type=mat_type,
        knowledge_band_target=mat_band,
        source_file_name=file_name,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        original_content=extracted_text,
        simplified_content=None,
        tags=mat_tags,
        visibility=mat_visibility,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    # Feature 2: Trigger AI student-ready format generation automatically
    try:
        ai_service.generate_student_ready_format(
            material_id=material.id,
            db=db,
            original_content=extracted_text or material.title
        )
        db.refresh(material)
    except Exception as ai_err:
        print(f"[StudyRouter] AI student format generation warning: {ai_err}")

    author = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or "Instructor"
    return _format_study_material(material, author)


@router.get("/materials/teacher/{teacher_id}", response_model=List[StudyMaterialResponse])
def get_teacher_materials(
    teacher_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all study materials created by a specific teacher.
    """
    materials = db.query(StudyMaterial).filter(
        StudyMaterial.user_id == teacher_id
    ).order_by(desc(StudyMaterial.created_at)).all()

    teacher_user = db.query(User).filter(User.id == teacher_id).first()
    author_name = getattr(teacher_user, "full_name", None) or getattr(teacher_user, "name", None) or "Instructor"

    return [_format_study_material(m, author_name) for m in materials]


@router.put("/materials/{material_id}", response_model=StudyMaterialResponse)
def update_teacher_material(
    material_id: uuid.UUID,
    payload: StudyMaterialUpdateJson,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """
    Edit material (teacher-owned only).
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    if material.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own study materials.")

    content_changed = False

    if payload.title is not None:
        material.title = payload.title
    if payload.subject is not None:
        material.subject = payload.subject
    if payload.topic is not None:
        material.topic = payload.topic
    if payload.description is not None:
        material.description = payload.description
    if payload.knowledge_band_target is not None:
        material.knowledge_band_target = payload.knowledge_band_target
    elif payload.target_band is not None:
        material.knowledge_band_target = payload.target_band
    if payload.material_type is not None:
        material.material_type = payload.material_type
    if payload.original_content is not None and payload.original_content != material.original_content:
        material.original_content = payload.original_content
        content_changed = True
    if payload.simplified_content is not None:
        material.simplified_content = payload.simplified_content
    if payload.tags is not None:
        material.tags = payload.tags
    if payload.visibility is not None:
        material.visibility = payload.visibility

    material.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(material)

    # If original content was updated and simplified wasn't manually provided, regenerate
    if content_changed and not payload.simplified_content:
        try:
            ai_service.generate_student_ready_format(material.id, db=db, original_content=material.original_content)
            db.refresh(material)
        except Exception as ai_e:
            print(f"[update_teacher_material] AI regenerate warning: {ai_e}")

    author = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or "Instructor"
    return _format_study_material(material, author)


@router.delete("/materials/{material_id}")
def delete_teacher_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """
    Remove material (teacher-owned only).
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    if material.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own study materials.")

    # Remove storage file if any
    if material.file_path and material.file_name:
        supabase = _get_supabase_client()
        if supabase:
            try:
                storage_key = f"{str(current_user.id)}/{str(material.id)}/{material.file_name}"
                supabase.storage.from_(STORAGE_BUCKET).remove([storage_key])
            except Exception as e:
                print(f"[delete_teacher_material] Supabase delete file warning: {e}")

    db.delete(material)
    db.commit()
    return {"status": "deleted", "id": str(material_id)}


@router.get("/materials/student/{student_id}", response_model=List[StudyMaterialResponse])
def get_student_study_materials(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Feature 3: Return materials filtered by student's knowledge band and enrolled subjects,
    including both original_content and simplified_content.
    """
    # 1. Look up student's assigned knowledge bands across topics
    bands = db.query(KnowledgeBand).filter(KnowledgeBand.user_id == student_id).all()
    band_map = {}
    for b in bands:
        # topic_id -> band (e.g. "foundation", "on_track", "advanced")
        band_val = b.band.value if hasattr(b.band, "value") else str(b.band)
        band_map[b.topic_id.lower().strip()] = band_val.lower().strip()

    # 2. Look up student's subjects from progress records
    progress_rows = db.query(Progress.subject).filter(Progress.user_id == student_id).distinct().all()
    enrolled_subjects = {row[0].lower().strip() for row in progress_rows if row[0]}

    # 3. Query all published study materials
    query = db.query(StudyMaterial, User.full_name, User.name).outerjoin(
        User, StudyMaterial.user_id == User.id
    ).filter(StudyMaterial.visibility == "published")

    results = query.order_by(desc(StudyMaterial.created_at)).all()

    filtered_list = []
    for mat, full_name, name in results:
        author = full_name or name or "Instructor"
        mat_band = (getattr(mat, "knowledge_band_target", None) or "all").lower().strip()
        mat_topic = (mat.topic or "").lower().strip()
        mat_subject = (mat.subject or "").lower().strip()

        # If student has a specific band assigned for this topic or subject:
        student_assigned_band = band_map.get(mat_topic) or band_map.get(mat_subject)

        # Inclusion criteria:
        # 1. Material is targeted to 'all' or has no specific target
        # 2. OR material matches student's assigned knowledge band
        # 3. OR student has no assigned band for this topic yet (show all materials for that subject)
        if mat_band in ("all", "", None) or student_assigned_band is None or mat_band == student_assigned_band:
            filtered_list.append(_format_study_material(mat, author))

    return filtered_list
