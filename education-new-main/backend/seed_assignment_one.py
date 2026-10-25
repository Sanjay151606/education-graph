"""
seed_assignment_one.py

Seed script to populate the database with the content from "Assignment One" as a published
note under Computer Science / Digital Logic.
Copies the PDF file to local upload storage and creates the StudyMaterial record with
proper structured metadata and allow_download permission enabled.
"""

import os
import sys
import uuid
import shutil
from datetime import datetime

# Add app directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import Base, engine, SessionLocal
from app.models import User, StudyMaterial

def seed_assignment_one():
    print("[Seed] Initializing database tables if needed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Find or create instructor user
        teacher = db.query(User).filter(User.role == "teacher").first()
        if not teacher:
            teacher = db.query(User).first()
        if not teacher:
            teacher = User(
                id=uuid.uuid4(),
                email="instructor@braingraph.edu",
                role="teacher",
                full_name="Prof. Alan Turing",
                created_at=datetime.utcnow(),
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
            print(f"[Seed] Created teacher user: {teacher.full_name} ({teacher.id})")
        else:
            print(f"[Seed] Using existing teacher: {getattr(teacher, 'full_name', 'Instructor')} ({teacher.id})")

        # 2. Check if Assignment One note already exists
        existing = db.query(StudyMaterial).filter(
            StudyMaterial.title.ilike("%Assignment Number One%")
        ).first()

        if existing:
            print(f"[Seed] Assignment One note already exists (ID: {existing.id}). Updating metadata...")
            existing.allow_download = True
            existing.visibility = "published"
            db.commit()
            print("[Seed] Existing Assignment One note updated successfully.")
            return existing.id

        # 3. Locate source PDF from frontend/public
        material_id = uuid.uuid4()
        frontend_pdf_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "frontend",
            "public",
            "assignment_one_30_questions.pdf"
        )

        file_name = "assignment_one_30_questions.pdf"
        file_size = 51443
        file_type = "application/pdf"
        target_file_path = None

        if os.path.exists(frontend_pdf_path):
            file_size = os.path.getsize(frontend_pdf_path)
            local_dir = os.path.join("uploads", "study-materials", str(teacher.id), str(material_id))
            os.makedirs(local_dir, exist_ok=True)
            target_file_path = os.path.join(local_dir, file_name)
            shutil.copyfile(frontend_pdf_path, target_file_path)
            print(f"[Seed] Copied assignment PDF to local storage: {target_file_path} ({file_size} bytes)")
        else:
            print(f"[Seed] Warning: source PDF not found at {frontend_pdf_path}. Creating record with direct reference.")

        # 4. Create StudyMaterial record
        structured = {
            "learning_objectives": [
                "Master positional number system conversions (decimal ↔ binary)",
                "Perform binary addition, subtraction, and multiplication arithmetic",
                "Evaluate bitwise AND, OR, XOR, NOT, NAND, and NOR operations",
                "Apply optimization tricks: parity checking, XOR swap, and Brian Kernighan algorithm",
                "Analyze integer ranges, sign-magnitude, 1's complement, and 2's complement arithmetic",
                "Construct and verify logic circuit truth tables including Half-Adders and De Morgan's Laws",
            ],
            "key_concepts": [
                "Positional expansion: Value = ∑ bit_i × 2^i",
                "Bitwise XOR (A ^ B): 1 if and only if operands differ",
                "Bitwise NOT (~A): Inverts all bits (~A = -(A + 1))",
                "XOR Swap: x ^= y; y ^= x; x ^= y;",
                "Brian Kernighan: N & (N - 1) clears lowest set bit",
                "Signed 2's complement range (16-bit): [-32,768 to +32,767]",
                "Half-Adder Sum = A ⊕ B, Carry = A ∧ B",
                "De Morgan's Law: ~(A | B) ≡ ~A & ~B",
            ],
            "important_points": [
                "2's complement is standard in modern ALUs because it has a single zero representation (unlike sign-magnitude) and uses ordinary addition hardware.",
                "Signed overflow occurs when the sum of two numbers with the same sign produces a result with the opposite sign bit.",
                "Unsigned underflow wraps around modulo 2^n (e.g. 3 - 10 in 8-bit yields 249).",
            ],
            "practice_questions": [
                "Q1: Convert decimal 215 to binary (Result: 11010111₂).",
                "Q6: Given A = 45 and B = 25, compute A & B and A | B.",
                "Q11: Demonstrate XOR swap algorithm for x = 14, y = 22.",
                "Q12: Trace Brian Kernighan algorithm for N = 43 (Total set bits = 4).",
                "Q16: Represent -68 in 8-bit 2's complement (Result: 10111100₂).",
                "Q27: Construct 3-variable truth table for F = (A & B) | (~C).",
                "Q28-Q29: Construct truth tables for Half-Adder Sum (A ⊕ B) and Carry (A ∧ B).",
                "Q30: Prove De Morgan's Law ~(A | B) ≡ ~A & ~B using complete truth table.",
            ]
        }

        note = StudyMaterial(
            id=material_id,
            user_id=teacher.id,
            title="Assignment Number One: Number Systems, Bitwise Operations, Integer Representations & Truth Tables (30 Questions)",
            subject="Computer Science",
            topic="Unit 1: Digital Logic & Number Systems",
            description="Complete Unit 1 question paper and step-by-step solutions covering conversions, arithmetic, bitwise operators, Brian Kernighan algorithm, integer ranges, signed overflow, and full truth tables.",
            material_type="PDF",
            structured_content=structured,
            file_name=file_name,
            file_path=target_file_path or f"uploads/study-materials/{teacher.id}/{material_id}/{file_name}",
            file_type=file_type,
            file_size=file_size,
            tags=["Computer Science", "Unit 1", "Digital Logic", "Truth Tables", "Bitwise", "Assignment One"],
            visibility="published",
            allow_download=True,
            created_at=datetime.utcnow(),
        )

        db.add(note)
        db.commit()
        db.refresh(note)
        print(f"[Seed] Successfully seeded Assignment One (ID: {note.id})!")
        return note.id

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding Assignment One: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_assignment_one()
