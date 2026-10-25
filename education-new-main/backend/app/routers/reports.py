import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.auth import get_current_user
from app.services import notification_service
from app.schemas import ReportOut

router = APIRouter(prefix="/reports", tags=["reports"])


class GenerateReportRequest(BaseModel):
    task_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = None
    score: Optional[float] = None


@router.post("/generate", response_model=ReportOut)
def trigger_generate_report(
    payload: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Triggers automatic report generation on work completion.
    Respects user notification preferences and prevents duplicates.
    """
    report = notification_service.generate_report(
        user_id=current_user.id,
        task_id=payload.task_id,
        session_id=payload.session_id,
        score=payload.score,
        db=db,
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )
    return report


@router.get("/{user_id}", response_model=List[ReportOut])
def get_user_reports(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists past completion reports for the student.
    """
    reports = db.query(Report).filter(
        Report.user_id == user_id
    ).order_by(desc(Report.created_at)).all()
    return reports


@router.post("/{report_id}/resend")
def resend_report(
    report_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Re-dispatches SMS/Email notification for an existing report.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id and getattr(current_user, "role", "") != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")

    email_sent = notification_service.send_email_report(report.id, db=db)
    sms_sent = notification_service.send_sms_report(report.id, db=db)

    report.sent_status = "sent" if (email_sent or sms_sent) else "failed"
    db.commit()
    return {"status": "dispatched", "email_sent": email_sent, "sms_sent": sms_sent}
