import os
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.task import Task
from app.models.progress import Progress
from app.models.report import Report
from app.config import settings
from app.database import SessionLocal


def _get_db_session(db: Optional[Session]) -> tuple[Session, bool]:
    if db is not None:
        return db, False
    new_db = SessionLocal()
    return new_db, True


def generate_report(
    user_id: uuid.UUID,
    task_id: Optional[uuid.UUID] = None,
    session_id: Optional[uuid.UUID] = None,
    score: Optional[float] = None,
    db: Optional[Session] = None,
) -> Optional[Report]:
    """
    Generates a completion report, stores it in the database,
    and dispatches SMS/Email notifications if opted in.
    Prevents duplicate report generation for the same task.
    """
    session, should_close = _get_db_session(db)
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"[notification_service] User {user_id} not found.")
            return None

        # Rate-limiting / Duplicate Check
        if task_id:
            existing_report = session.query(Report).filter(
                Report.user_id == user_id,
                Report.task_id == task_id
            ).first()
            if existing_report:
                print(f"[notification_service] Report already exists for task {task_id}.")
                return existing_report

        # Gather context
        task_title = "Study Module"
        task_desc = ""
        if task_id:
            task = session.query(Task).filter(Task.id == task_id).first()
            if task:
                task_title = task.title
                task_desc = task.description or ""

        # Fetch recent progress
        student_name = getattr(user, "full_name", None) or getattr(user, "name", None) or "Student"
        
        # Build plain-language constructive summary
        if score is not None:
            summary = (
                f"🎉 Great job! {student_name} completed '{task_title}' with a score of {score}%! "
                f"Consistent effort is building stronger neural connections and topic mastery."
            )
        else:
            summary = (
                f"🎯 Milestone reached! {student_name} successfully finished '{task_title}'. "
                f"Micro-steps were executed with focused determination. Keep up the great momentum!"
            )

        notify_enabled = getattr(user, "notify_on_completion", True)
        sent_status = "pending" if notify_enabled else "opted_out"

        report = Report(
            id=uuid.uuid4(),
            user_id=user.id,
            task_id=task_id,
            session_id=session_id,
            summary=summary,
            score=score,
            sent_via="both",
            sent_status=sent_status,
            created_at=datetime.utcnow(),
        )

        session.add(report)
        session.commit()
        session.refresh(report)

        if notify_enabled:
            # Trigger dispatch
            email_ok = send_email_report(report.id, db=session)
            sms_ok = send_sms_report(report.id, db=session)

            if email_ok or sms_ok:
                report.sent_status = "sent"
            else:
                report.sent_status = "sent_simulated"

            session.commit()
            session.refresh(report)

        return report
    except Exception as exc:
        print(f"[notification_service] generate_report error: {exc}")
        session.rollback()
        return None
    finally:
        if should_close:
            session.close()


def send_email_report(report_id: uuid.UUID, db: Optional[Session] = None) -> bool:
    """
    Sends report via Email to student and registered parent email.
    """
    session, should_close = _get_db_session(db)
    try:
        report = session.query(Report).filter(Report.id == report_id).first()
        if not report:
            return False

        user = session.query(User).filter(User.id == report.user_id).first()
        if not user:
            return False

        recipients = []
        if user.email:
            recipients.append(user.email)
        if getattr(user, "parent_email", None):
            recipients.append(user.parent_email)

        if not recipients:
            print("[notification_service] No email recipients configured.")
            return False

        student_name = getattr(user, "full_name", None) or getattr(user, "name", None) or "Student"
        subject = f"🧠 BrainGraph Completion Report: {student_name}"
        
        # Plain text / HTML content
        body = (
            f"Hello,\n\n"
            f"Here is the latest study completion update for {student_name}:\n\n"
            f"{report.summary}\n\n"
            f"View full learning analytics and report history in your BrainGraph dashboard:\n"
            f"http://localhost:5173/reports\n\n"
            f"— The BrainGraph Learning Team"
        )

        sendgrid_key = os.environ.get("SENDGRID_API_KEY")
        resend_key = os.environ.get("RESEND_API_KEY")

        if resend_key:
            try:
                import httpx
                resp = httpx.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                    json={
                        "from": "BrainGraph <notifications@braingraph.edu>",
                        "to": recipients,
                        "subject": subject,
                        "text": body,
                    },
                    timeout=5.0
                )
                if resp.status_code in (200, 201):
                    return True
            except Exception as e:
                print(f"[notification_service] Resend API error: {e}")

        # Simulated fallback logging
        print(f"[notification_service] ✉️ Simulated EMAIL dispatched to {recipients}: {subject}")
        return True
    except Exception as err:
        print(f"[notification_service] send_email_report error: {err}")
        return False
    finally:
        if should_close:
            session.close()


def send_sms_report(report_id: uuid.UUID, db: Optional[Session] = None) -> bool:
    """
    Sends headline report via SMS to student and registered parent mobile number.
    """
    session, should_close = _get_db_session(db)
    try:
        report = session.query(Report).filter(Report.id == report_id).first()
        if not report:
            return False

        user = session.query(User).filter(User.id == report.user_id).first()
        if not user:
            return False

        phone_numbers = []
        if getattr(user, "phone_number", None):
            phone_numbers.append(user.phone_number)
        if getattr(user, "parent_phone_number", None):
            phone_numbers.append(user.parent_phone_number)

        if not phone_numbers:
            print("[notification_service] No phone numbers configured for SMS.")
            return False

        student_name = getattr(user, "full_name", None) or getattr(user, "name", None) or "Student"
        sms_text = f"🧠 BrainGraph: {student_name} finished a module! {report.summary[:100]}... Details: http://localhost:5173/reports"

        twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
        twilio_from = os.environ.get("TWILIO_PHONE_NUMBER")

        if twilio_sid and twilio_token and twilio_from:
            try:
                import httpx
                for number in phone_numbers:
                    httpx.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                        auth=(twilio_sid, twilio_token),
                        data={"From": twilio_from, "To": number, "Body": sms_text},
                        timeout=5.0
                    )
                return True
            except Exception as e:
                print(f"[notification_service] Twilio SMS error: {e}")

        # Simulated fallback logging
        print(f"[notification_service] 📱 Simulated SMS dispatched to {phone_numbers}: {sms_text}")
        return True
    except Exception as err:
        print(f"[notification_service] send_sms_report error: {err}")
        return False
    finally:
        if should_close:
            session.close()
