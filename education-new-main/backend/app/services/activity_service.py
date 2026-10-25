import uuid
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.student_activity import StudentActivity
from app.database import SessionLocal


def _get_db_session(db: Optional[Session]) -> tuple[Session, bool]:
    if db is not None:
        return db, False
    new_db = SessionLocal()
    return new_db, True


def log_activity(
    user_id: Any,
    activity_type: str,
    reference_id: Optional[Any] = None,
    metadata: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None,
) -> Optional[StudentActivity]:
    """
    Safely logs a single student activity row. Never raises an exception to the caller.
    """
    session, should_close = _get_db_session(db)
    try:
        u_uuid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
        ref_uuid = None
        if reference_id:
            try:
                ref_uuid = uuid.UUID(str(reference_id)) if isinstance(reference_id, str) else reference_id
            except Exception:
                ref_uuid = None

        act = StudentActivity(
            id=uuid.uuid4(),
            user_id=u_uuid,
            activity_type=activity_type,
            reference_id=ref_uuid,
            metadata_json=metadata or {},
            created_at=datetime.utcnow(),
        )
        session.add(act)
        session.commit()
        session.refresh(act)
        return act
    except Exception as exc:
        print(f"[activity_service] log_activity error: {exc}")
        session.rollback()
        return None
    finally:
        if should_close:
            session.close()


def get_activity_timeline(
    user_id: Any,
    range_filter: str = "week",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Retrieves activity records for a user grouped by time bracket (Today, Yesterday, Earlier this week, Previous).
    """
    session, should_close = _get_db_session(db)
    try:
        u_uuid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
        now = datetime.utcnow()

        if range_filter == "today":
            start_date = now - timedelta(days=1)
        elif range_filter == "month":
            start_date = now - timedelta(days=30)
        else:  # "week" default
            start_date = now - timedelta(days=7)

        rows = (
            session.query(StudentActivity)
            .filter(
                StudentActivity.user_id == u_uuid,
                StudentActivity.created_at >= start_date,
            )
            .order_by(desc(StudentActivity.created_at))
            .all()
        )

        today_date = now.date()
        yesterday_date = today_date - timedelta(days=1)
        week_start_date = today_date - timedelta(days=7)

        today_items = []
        yesterday_items = []
        this_week_items = []
        earlier_items = []

        for r in rows:
            created_at_dt = r.created_at
            item_date = created_at_dt.date()
            item_dict = {
                "id": str(r.id),
                "activity_type": r.activity_type,
                "reference_id": str(r.reference_id) if r.reference_id else None,
                "metadata": r.metadata_json or {},
                "created_at": created_at_dt.isoformat(),
                "time_formatted": created_at_dt.strftime("%I:%M %p"),
                "date_formatted": created_at_dt.strftime("%b %d"),
            }

            if item_date == today_date:
                today_items.append(item_dict)
            elif item_date == yesterday_date:
                yesterday_items.append(item_dict)
            elif item_date >= week_start_date:
                this_week_items.append(item_dict)
            else:
                earlier_items.append(item_dict)

        return {
            "user_id": str(u_uuid),
            "range": range_filter,
            "total_activities": len(rows),
            "groups": {
                "today": today_items,
                "yesterday": yesterday_items,
                "this_week": this_week_items,
                "earlier": earlier_items,
            },
        }
    except Exception as exc:
        print(f"[activity_service] get_activity_timeline error: {exc}")
        return {
            "user_id": str(user_id),
            "range": range_filter,
            "total_activities": 0,
            "groups": {"today": [], "yesterday": [], "this_week": [], "earlier": []},
        }
    finally:
        if should_close:
            session.close()


def get_streak(
    user_id: Any,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Calculates consecutive active days based on student_activity dates.
    """
    session, should_close = _get_db_session(db)
    try:
        u_uuid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
        
        # Query distinct activity dates within the past 60 days
        cutoff = datetime.utcnow() - timedelta(days=60)
        rows = (
            session.query(StudentActivity.created_at)
            .filter(
                StudentActivity.user_id == u_uuid,
                StudentActivity.created_at >= cutoff,
            )
            .order_by(desc(StudentActivity.created_at))
            .all()
        )

        active_dates = set()
        for (created_at_dt,) in rows:
            if created_at_dt:
                active_dates.add(created_at_dt.date())

        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)

        # Check if active today or yesterday to continue streak
        streak = 0
        curr = today if today in active_dates else yesterday

        while curr in active_dates:
            streak += 1
            curr = curr - timedelta(days=1)

        # If streak is 0, provide baseline 1 if active today
        if streak == 0 and today in active_dates:
            streak = 1

        is_active_today = today in active_dates

        return {
            "user_id": str(u_uuid),
            "current_streak_days": streak,
            "active_today": is_active_today,
            "encouragement": (
                "🔥 Amazing consistency! Keep going!"
                if streak >= 3
                else "🌱 Great start to your learning momentum!"
            ),
        }
    except Exception as exc:
        print(f"[activity_service] get_streak error: {exc}")
        return {
            "user_id": str(user_id),
            "current_streak_days": 1,
            "active_today": True,
            "encouragement": "🌱 Keep building your daily momentum!",
        }
    finally:
        if should_close:
            session.close()
