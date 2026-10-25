import os
import uuid
import json
from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
    Request,
)
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database import get_db
from app.models import User, StudyMaterial
from app.schemas.study_material import (
    StudyMaterialCreate,
    StudyMaterialUpdate,
    StudyMaterialOut,
    MaterialSignedUrlOut,
)
from app.auth import get_current_user, require_teacher, require_student
from app.config import settings

router = APIRouter(tags=["study_materials"])

STORAGE_BUCKET = "study-materials"
LOCAL_MATERIALS_DIR = os.path.join("uploads", "study-materials")
os.makedirs(LOCAL_MATERIALS_DIR, exist_ok=True)


def _get_supabase_client():
    if settings.supabase_url and settings.supabase_key:
        try:
            from supabase import create_client
            return create_client(settings.supabase_url, settings.supabase_key)
        except Exception:
            return None
    return None


def _format_material_out(mat: StudyMaterial, author_name: str = "Instructor", request: Optional[Request] = None) -> StudyMaterialOut:
    has_file = bool(mat.file_path or mat.file_name)
    download_url = None
    if has_file:
        download_url = f"/api/study-materials/{str(mat.id)}/file"

    return StudyMaterialOut(
        id=mat.id,
        user_id=mat.user_id,
        author_name=author_name or "Instructor",
        title=mat.title,
        subject=mat.subject or "General",
        topic=mat.topic or "",
        description=mat.description,
        material_type=mat.material_type or "Notes",
        structured_content=mat.structured_content or {},
        original_content=mat.original_content or getattr(mat, "original_text", None),
        simplified_content=mat.simplified_content or getattr(mat, "simplified_text", None),
        original_text=mat.original_content or getattr(mat, "original_text", None),
        file_name=mat.file_name,
        file_path=mat.file_path,
        file_type=mat.file_type,
        file_size=mat.file_size,
        has_file=has_file,
        download_url=download_url,
        tags=mat.tags or [],
        visibility=mat.visibility or "published",
        created_at=mat.created_at,
        updated_at=mat.updated_at,
    )


# ─── 1. List Study Materials (Search, Filter, Role-Aware) ────────────────────

@router.get("/api/study-materials", response_model=List[StudyMaterialOut])
@router.get("/api/materials", response_model=List[StudyMaterialOut])
def list_study_materials(
    subject: Optional[str] = Query(None, description="Filter by subject"),
    material_type: Optional[str] = Query(None, description="Filter by material type"),
    search: Optional[str] = Query(None, description="Search keyword in title, topic, subject, tags"),
    visibility: Optional[str] = Query(None, description="Filter by visibility (teachers only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    List study materials:
    - Students only see 'published' materials.
    - Teachers see all 'published' materials + their own 'draft' materials.
    - Supports full search & filtering by subject and material type.
    """
    user_role = getattr(current_user, "role", "student") or "student"

    query = db.query(StudyMaterial, User.full_name, User.name).outerjoin(User, StudyMaterial.user_id == User.id)

    # 1. Role-based visibility filter
    if user_role == "teacher":
        if visibility:
            if visibility == "draft":
                query = query.filter(StudyMaterial.visibility == "draft", StudyMaterial.user_id == current_user.id)
            elif visibility == "published":
                query = query.filter(StudyMaterial.visibility == "published")
            elif visibility == "my_materials":
                query = query.filter(StudyMaterial.user_id == current_user.id)
        else:
            # Teacher sees all published materials + their own drafts
            query = query.filter(
                or_(
                    StudyMaterial.visibility == "published",
                    StudyMaterial.user_id == current_user.id
                )
            )
    else:
        # Students MUST ONLY receive published materials
        query = query.filter(StudyMaterial.visibility == "published")

    # 2. Subject filter
    if subject and subject.lower() != "all":
        query = query.filter(StudyMaterial.subject.ilike(f"%{subject}%"))

    # 3. Material Type filter
    if material_type and material_type.lower() != "all":
        query = query.filter(StudyMaterial.material_type.ilike(f"%{material_type}%"))

    # 4. Keyword search
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                StudyMaterial.title.ilike(term),
                StudyMaterial.subject.ilike(term),
                StudyMaterial.topic.ilike(term),
                StudyMaterial.description.ilike(term),
            )
        )

    results = query.order_by(desc(StudyMaterial.created_at)).all()

    out_list = []
    for mat, full_name, name in results:
        author = full_name or name or "Instructor"
        out_list.append(_format_material_out(mat, author, request))

    return out_list


# ─── 2. Get Single Material ──────────────────────────────────────────────────

@router.get("/api/study-materials/{material_id}", response_model=StudyMaterialOut)
@router.get("/api/materials/{material_id}", response_model=StudyMaterialOut)
def get_study_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Get detailed study material notes and metadata.
    - Verified access: Students can only view if published.
    """
    user_role = getattr(current_user, "role", "student") or "student"

    row = db.query(StudyMaterial, User.full_name, User.name).outerjoin(
        User, StudyMaterial.user_id == User.id
    ).filter(StudyMaterial.id == material_id).first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    mat, full_name, name = row

    if mat.visibility == "draft" and user_role != "teacher" and mat.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This material is currently in draft.")

    author = full_name or name or "Instructor"
    return _format_material_out(mat, author, request)


# ─── 3. Create Study Material (Teacher) ──────────────────────────────────────

@router.post("/api/study-materials", response_model=StudyMaterialOut)
@router.post("/api/materials", response_model=StudyMaterialOut)
def create_study_material_json(
    material_in: StudyMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
    request: Request = None,
):
    """
    Teacher creates structured study notes directly.
    """
    material = StudyMaterial(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=material_in.title,
        subject=material_in.subject or "General",
        topic=material_in.topic or "",
        description=material_in.description,
        material_type=material_in.material_type or "Notes",
        structured_content=material_in.structured_content or {},
        original_content=material_in.original_content,
        tags=material_in.tags or [],
        visibility=material_in.visibility or "published",
        created_at=datetime.utcnow(),
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    author = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or "Instructor"
    return _format_material_out(material, author, request)


# ─── 4. Upload File Material (PDF, DOCX, PPTX, TXT) ──────────────────────────

@router.post("/api/study-materials/upload", response_model=StudyMaterialOut)
async def upload_study_material_file(
    title: str = Form(...),
    subject: str = Form("General"),
    topic: str = Form(""),
    description: str = Form(""),
    material_type: str = Form("PDF"),
    visibility: str = Form("published"),
    tags_json: str = Form("[]"),
    structured_content_json: str = Form("{}"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
    request: Request = None,
):
    """
    Teacher creates study material with an optional uploaded document (PDF, DOCX, etc.)
    - Stores file in private Supabase Storage bucket 'study-materials'
    - Local fallback storage for offline development
    """
    material_id = uuid.uuid4()
    file_name = None
    file_path = None
    file_type = None
    file_size = None

    if file and file.filename:
        file_name = file.filename
        file_type = file.content_type or "application/octet-stream"
        content = await file.read()
        file_size = len(content)

        # 1. Local disk fallback
        local_dir = os.path.join(LOCAL_MATERIALS_DIR, str(current_user.id), str(material_id))
        os.makedirs(local_dir, exist_ok=True)
        local_filepath = os.path.join(local_dir, file_name)
        with open(local_filepath, "wb") as f:
            f.write(content)

        # 2. Supabase Storage upload
        supabase = _get_supabase_client()
        storage_key = f"{str(current_user.id)}/{str(material_id)}/{file_name}"
        if supabase:
            try:
                supabase.storage.from_(STORAGE_BUCKET).upload(
                    path=storage_key,
                    file=content,
                    file_options={"content-type": file_type, "upsert": "true"}
                )
                file_path = f"{STORAGE_BUCKET}/{storage_key}"
            except Exception as e:
                print(f"[StudyMaterials] Supabase storage upload warning: {e}")
                file_path = local_filepath
        else:
            file_path = local_filepath

    try:
        parsed_tags = json.loads(tags_json) if tags_json else []
    except Exception:
        parsed_tags = [t.strip() for t in tags_json.split(",") if t.strip()]

    try:
        parsed_structured = json.loads(structured_content_json) if structured_content_json else {}
    except Exception:
        parsed_structured = {}

    material = StudyMaterial(
        id=material_id,
        user_id=current_user.id,
        title=title,
        subject=subject or "General",
        topic=topic or "",
        description=description,
        material_type=material_type or ("PDF" if file_name else "Notes"),
        structured_content=parsed_structured,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        tags=parsed_tags,
        visibility=visibility or "published",
        created_at=datetime.utcnow(),
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    author = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or "Instructor"
    return _format_material_out(material, author, request)


# ─── 5. Update Study Material (Teacher Owner) ────────────────────────────────

@router.put("/api/study-materials/{material_id}", response_model=StudyMaterialOut)
def update_study_material(
    material_id: uuid.UUID,
    material_in: StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
    request: Request = None,
):
    """
    Teacher updates material details (verifies ownership).
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    if material.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own materials.")

    if material_in.title is not None:
        material.title = material_in.title
    if material_in.subject is not None:
        material.subject = material_in.subject
    if material_in.topic is not None:
        material.topic = material_in.topic
    if material_in.description is not None:
        material.description = material_in.description
    if material_in.material_type is not None:
        material.material_type = material_in.material_type
    if material_in.structured_content is not None:
        material.structured_content = material_in.structured_content
    if material_in.original_content is not None:
        material.original_content = material_in.original_content
    if material_in.tags is not None:
        material.tags = material_in.tags
    if material_in.visibility is not None:
        material.visibility = material_in.visibility

    material.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(material)

    author = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or "Instructor"
    return _format_material_out(material, author, request)


# ─── 6. Toggle Visibility (Publish / Draft) ──────────────────────────────────

@router.patch("/api/study-materials/{material_id}/publish", response_model=StudyMaterialOut)
def toggle_publish_material(
    material_id: uuid.UUID,
    visibility: Optional[str] = Query(None, description="New visibility: 'published' or 'draft'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
    request: Request = None,
):
    """
    Teacher publishes or unpublishes (drafts) their study material.
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    if material.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only publish/unpublish your own materials.")

    if visibility:
        material.visibility = visibility
    else:
        # Toggle
        material.visibility = "draft" if material.visibility == "published" else "published"

    material.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(material)

    author = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or "Instructor"
    return _format_material_out(material, author, request)


# ─── 7. Delete Study Material (Teacher Owner) ────────────────────────────────

@router.delete("/api/study-materials/{material_id}")
def delete_study_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """
    Teacher deletes own study material and any associated storage files.
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    if material.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own materials.")

    # Remove storage file if present
    if material.file_path and material.file_name:
        supabase = _get_supabase_client()
        if supabase:
            try:
                storage_key = f"{str(current_user.id)}/{str(material.id)}/{material.file_name}"
                supabase.storage.from_(STORAGE_BUCKET).remove([storage_key])
            except Exception as e:
                print(f"[StudyMaterials] Supabase delete file warning: {e}")

    db.delete(material)
    db.commit()

    return {"status": "deleted", "id": str(material_id)}


# ─── 8. Download / Signed URL / Direct Stream ────────────────────────────────

@router.get("/api/study-materials/{material_id}/signed-url", response_model=MaterialSignedUrlOut)
def get_material_signed_url(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a 300-second short-lived signed URL for private Supabase Storage download.
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

    user_role = getattr(current_user, "role", "student") or "student"
    if material.visibility == "draft" and user_role != "teacher" and material.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to draft material.")

    if not material.file_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This material does not have an attached file.")

    supabase = _get_supabase_client()
    if supabase:
        try:
            storage_key = f"{str(material.user_id)}/{str(material.id)}/{material.file_name}"
            signed_res = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(storage_key, 300)
            url = signed_res.get("signedURL") or signed_res.get("signedUrl")
            if url:
                return MaterialSignedUrlOut(
                    id=material.id,
                    file_name=material.file_name,
                    signed_url=url,
                    expires_in_seconds=300
                )
        except Exception as e:
            print(f"[StudyMaterials] create_signed_url error: {e}")

    # Fallback to backend streaming endpoint
    return MaterialSignedUrlOut(
        id=material.id,
        file_name=material.file_name,
        signed_url=f"/api/study-materials/{str(material.id)}/file",
        expires_in_seconds=300
    )


@router.get("/api/study-materials/{material_id}/file")
def stream_material_file(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Direct file delivery endpoint for in-app PDF / Document viewing or downloading.
    """
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material or not material.file_name:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material file not found")

    local_path = os.path.join(LOCAL_MATERIALS_DIR, str(material.user_id), str(material.id), material.file_name)
    if os.path.exists(local_path):
        return FileResponse(
            path=local_path,
            filename=material.file_name,
            media_type=material.file_type or "application/octet-stream"
        )

    # Supabase download
    supabase = _get_supabase_client()
    if supabase:
        try:
            storage_key = f"{str(material.user_id)}/{str(material.id)}/{material.file_name}"
            file_bytes = supabase.storage.from_(STORAGE_BUCKET).download(storage_key)
            import io
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type=material.file_type or "application/octet-stream",
                headers={"Content-Disposition": f'inline; filename="{material.file_name}"'}
            )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File download error: {e}")

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File content not located")
