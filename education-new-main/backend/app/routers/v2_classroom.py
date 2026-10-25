import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Set, Optional, Any
import uuid
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db, SessionLocal
from app.models import User
from app.models_v2 import EngagementEvent, ConfusionBookmark, AIRecommendation
from app.schemas_v2 import (
    EngagementEventCreate,
    ClassAggregateSummary,
    AggregateEngagementTile,
    ConfusionBookmarkCreate,
    ConfusionBookmarkOut,
    PostClassFollowupOut,
    VALID_ENGAGEMENT_STATES,
)
from app.auth import get_current_user, require_student, require_teacher
from app.services.v2_services import generate_followup
from app.config import settings

router = APIRouter(tags=["v2_classroom"])


# ==================== WEBSOCKET MANAGER FOR LIVE CLASSROOM ====================

class LiveClassroomManager:
    def __init__(self):
        # session_id -> Set[WebSocket] for teacher monitors
        self.teacher_subscribers: Dict[str, Set[WebSocket]] = {}
        # session_id -> Dict[student_socket, {"user_id": str, "state": str, "updated_at": datetime}]
        self.student_publishers: Dict[str, Dict[WebSocket, Dict[str, Any]]] = {}
        # session_id -> rolling window of recent events for threshold alerting
        self.rolling_history: Dict[str, List[Dict[str, Any]]] = {}

    async def connect_teacher(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.teacher_subscribers:
            self.teacher_subscribers[session_id] = set()
        self.teacher_subscribers[session_id].add(websocket)
        # Send immediate initial aggregate state
        summary = self.get_class_summary(session_id)
        await websocket.send_json(summary)

    def disconnect_teacher(self, session_id: str, websocket: WebSocket):
        if session_id in self.teacher_subscribers:
            self.teacher_subscribers[session_id].discard(websocket)

    async def connect_student(self, session_id: str, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if session_id not in self.student_publishers:
            self.student_publishers[session_id] = {}
        self.student_publishers[session_id][websocket] = {
            "user_id": user_id,
            "state": "focused",
            "confidence": 0.85,
            "updated_at": datetime.utcnow()
        }
        await self.broadcast_class_summary(session_id)

    async def disconnect_student(self, session_id: str, websocket: WebSocket):
        if session_id in self.student_publishers:
            self.student_publishers[session_id].pop(websocket, None)
        await self.broadcast_class_summary(session_id)

    def record_student_event(self, session_id: str, websocket: WebSocket, user_id: str, state: str, confidence: float):
        if session_id not in self.student_publishers:
            self.student_publishers[session_id] = {}
        now = datetime.utcnow()
        self.student_publishers[session_id][websocket] = {
            "user_id": user_id,
            "state": state,
            "confidence": confidence,
            "updated_at": now
        }
        # Record in rolling history (keep last 2 minutes)
        if session_id not in self.rolling_history:
            self.rolling_history[session_id] = []
        self.rolling_history[session_id].append({
            "user_id": user_id,
            "state": state,
            "timestamp": now
        })
        cutoff = now - timedelta(minutes=2)
        self.rolling_history[session_id] = [
            ev for ev in self.rolling_history[session_id] if ev["timestamp"] >= cutoff
        ]

    def get_class_summary(self, session_id: str) -> Dict[str, Any]:
        """
        Computes strict AGGREGATE/CLASS-LEVEL ONLY metrics.
        No student names or individual histories are included (Privacy requirement).
        """
        now = datetime.utcnow()
        active_map = self.student_publishers.get(session_id, {})
        # If no active live sockets, provide realistic default class grid for demo/preview
        total_students = len(active_map)

        focused_count = 0
        mild_confusion_count = 0
        lost_or_disengaged_count = 0
        tiles = []

        if total_students > 0:
            for idx, (ws, data) in enumerate(active_map.items(), start=1):
                st = data.get("state", "focused")
                if st == "focused":
                    focused_count += 1
                    color = "green"
                elif st == "mild_confusion":
                    mild_confusion_count += 1
                    color = "yellow"
                else: # lost / disengaged
                    lost_or_disengaged_count += 1
                    color = "red"

                secs_ago = max(0, int((now - data.get("updated_at", now)).total_seconds()))
                tiles.append({
                    "student_index": idx,
                    "state": st,
                    "color_code": color,
                    "last_updated_seconds_ago": secs_ago
                })
        else:
            # Simulated preview grid (e.g. 24 students in classroom)
            total_students = 24
            focused_count = 18
            mild_confusion_count = 4
            lost_or_disengaged_count = 2
            states = ["focused"] * 18 + ["mild_confusion"] * 4 + ["lost"] * 2
            for i, st in enumerate(states, start=1):
                color = "green" if st == "focused" else ("yellow" if st == "mild_confusion" else "red")
                tiles.append({
                    "student_index": i,
                    "state": st,
                    "color_code": color,
                    "last_updated_seconds_ago": 2
                })

        comprehension_pct = round((focused_count / max(total_students, 1)) * 100.0, 1)
        attention_pct = round(((focused_count + mild_confusion_count) / max(total_students, 1)) * 100.0, 1)

        # Check rolling 2-minute window: alert if > 25% are yellow/red
        recent_events = self.rolling_history.get(session_id, [])
        if recent_events:
            confused_in_window = sum(1 for e in recent_events if e["state"] in ("mild_confusion", "lost", "disengaged"))
            confused_ratio = confused_in_window / max(len(recent_events), 1)
        else:
            confused_ratio = (mild_confusion_count + lost_or_disengaged_count) / max(total_students, 1)

        comprehension_drop_alert = confused_ratio > 0.25
        alert_message = (
            "⚠️ Comprehension dropped (>25% students confused or disengaged) — consider a recap."
            if comprehension_drop_alert else None
        )

        return {
            "session_id": session_id,
            "active_students_count": total_students,
            "focused_count": focused_count,
            "mild_confusion_count": mild_confusion_count,
            "lost_or_disengaged_count": lost_or_disengaged_count,
            "comprehension_rate_pct": comprehension_pct,
            "attention_rate_pct": attention_pct,
            "comprehension_drop_alert": comprehension_drop_alert,
            "alert_message": alert_message,
            "tiles": tiles
        }

    async def broadcast_class_summary(self, session_id: str):
        subscribers = self.teacher_subscribers.get(session_id, set()).copy()
        if not subscribers:
            return
        summary = self.get_class_summary(session_id)
        dead = []
        for ws in subscribers:
            try:
                await ws.send_json(summary)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.teacher_subscribers[session_id].discard(d)

    async def send_to_student(self, session_id: str, target_user_id: str, message: dict):
        """Sends a WebRTC signaling message to a specific connected student."""
        active_map = self.student_publishers.get(session_id, {})
        for ws, data in active_map.items():
            if str(data.get("user_id")) == str(target_user_id):
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def send_to_teachers(self, session_id: str, message: dict):
        """Sends a WebRTC signaling message from a student to all connected teachers."""
        subscribers = self.teacher_subscribers.get(session_id, set()).copy()
        dead = []
        for ws in subscribers:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.teacher_subscribers[session_id].discard(d)


manager = LiveClassroomManager()


# ==================== WEBSOCKET ENDPOINT ====================

@router.websocket("/ws/engagement/{session_id}")
async def websocket_engagement(
    websocket: WebSocket,
    session_id: str,
    role: str = Query("student"), # "student" or "teacher"
    user_id: Optional[str] = Query(None)
):
    """
    Live WebSocket endpoint for classroom engagement & WebRTC signaling.
    - Students stream periodic attention estimates & exchange WebRTC camera tracks.
    - Teachers receive live aggregated grid updates & can join 1-on-1 live student streams.
    """
    if role == "teacher":
        await manager.connect_teacher(session_id, websocket)
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    payload = json.loads(data)
                    msg_type = payload.get("type")

                    # Handle WebRTC signaling from teacher to student
                    if msg_type in ("webrtc_offer", "webrtc_answer", "webrtc_ice_candidate", "teacher_join_live", "teacher_leave_live"):
                        target_student = payload.get("target_user_id")
                        if target_student:
                            await manager.send_to_student(session_id, target_student, payload)
                    else:
                        # Standard refresh/ping
                        summary = manager.get_class_summary(session_id)
                        await websocket.send_json(summary)
                except json.JSONDecodeError:
                    summary = manager.get_class_summary(session_id)
                    await websocket.send_json(summary)
        except WebSocketDisconnect:
            manager.disconnect_teacher(session_id, websocket)
    else:
        # Student publisher
        resolved_user_id = user_id or str(uuid.uuid4())
        await manager.connect_student(session_id, websocket, resolved_user_id)
        db = SessionLocal()
        try:
            while True:
                msg_text = await websocket.receive_text()
                try:
                    payload = json.loads(msg_text)
                    msg_type = payload.get("type")

                    # Handle WebRTC signaling from student to teacher
                    if msg_type in ("webrtc_offer", "webrtc_answer", "webrtc_ice_candidate", "live_stream_started", "live_stream_stopped"):
                        payload["from_user_id"] = resolved_user_id
                        await manager.send_to_teachers(session_id, payload)
                        continue

                    state = payload.get("state", "focused")
                    confidence = float(payload.get("confidence", 0.85))
                    metadata = payload.get("metadata", {})

                    # Update in-memory live state
                    manager.record_student_event(session_id, websocket, resolved_user_id, state, confidence)

                    # Persist event asynchronously to database
                    try:
                        uid_obj = uuid.UUID(resolved_user_id)
                        db_event = EngagementEvent(
                            session_id=session_id,
                            user_id=uid_obj,
                            state=state,
                            confidence=confidence,
                            metadata_payload=metadata,
                            timestamp=datetime.utcnow()
                        )
                        db.add(db_event)
                        db.commit()
                    except Exception:
                        db.rollback()

                    # Broadcast aggregated updates to teacher dashboard
                    await manager.broadcast_class_summary(session_id)

                    # Acknowledge student client
                    await websocket.send_json({"status": "received", "state": state})
                except json.JSONDecodeError:
                    pass
        except WebSocketDisconnect:
            await manager.disconnect_student(session_id, websocket)
        finally:
            db.close()



# ==================== REST ENDPOINTS ====================

@router.post("/api/v2/engagement/event")
def post_engagement_event(
    event_in: EngagementEventCreate,
    current_user: User = Depends(require_student),  # Auth required — students only
    db: Session = Depends(get_db)
):
    """
    REST fallback endpoint for posting a camera-derived engagement estimate.
    - User identity is derived from the authenticated Supabase token (NOT from payload).
    - Only stores derived state+confidence — never raw video.
    - State and confidence are validated server-side.
    """
    # Validate state
    if event_in.state not in VALID_ENGAGEMENT_STATES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid engagement state '{event_in.state}'.",
        )
    # Validate confidence
    if not (0.0 <= event_in.confidence <= 1.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Confidence must be between 0.0 and 1.0.",
        )

    event = EngagementEvent(
        session_id=event_in.session_id,
        user_id=current_user.id,  # Always from token — never from client payload
        state=event_in.state,
        confidence=event_in.confidence,
        metadata_payload=event_in.metadata_payload or {},
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    return {"status": "ok", "state": event.state}



@router.get("/api/v2/engagement/summary/{session_id}", response_model=ClassAggregateSummary)
def get_engagement_summary(session_id: str):
    """REST endpoint for teacher dashboard to fetch aggregated in-memory class summary."""
    return manager.get_class_summary(session_id)


@router.get("/api/v2/engagement/class-summary/{session_id}")
def get_teacher_class_summary(
    session_id: str,
    current_user: User = Depends(require_teacher),  # Teachers only
    db: Session = Depends(get_db)
):
    """
    Teacher-authenticated endpoint: returns aggregate camera engagement
    insights for a given session from the database (last 5 minutes).
    Students receive HTTP 403 if they try to access this endpoint.
    """
    from datetime import timedelta
    from sqlalchemy import func

    cutoff = datetime.utcnow() - timedelta(minutes=5)

    # Aggregate counts of latest state per user in the session window
    rows = (
        db.query(EngagementEvent.state, func.count(EngagementEvent.id).label("count"))
        .filter(
            EngagementEvent.session_id == session_id,
            EngagementEvent.timestamp >= cutoff,
        )
        .group_by(EngagementEvent.state)
        .all()
    )

    state_counts = {row.state: row.count for row in rows}
    total = sum(state_counts.values()) or 1

    focused = state_counts.get("focused", 0)
    possibly_confused = state_counts.get("possibly_confused", 0) + state_counts.get("mild_confusion", 0)
    possibly_disengaged = state_counts.get("possibly_disengaged", 0) + state_counts.get("lost", 0) + state_counts.get("disengaged", 0)
    no_face = state_counts.get("no_face", 0)
    camera_off = state_counts.get("camera_off", 0)
    unknown_count = state_counts.get("unknown", 0)

    overall_engagement_pct = round((focused / total) * 100, 1)

    # Also merge in the live in-memory summary (WebSocket data)
    live_summary = manager.get_class_summary(session_id)

    return {
        "session_id": session_id,
        "window_minutes": 5,
        "total_events": sum(state_counts.values()),
        "focused": focused,
        "possibly_confused": possibly_confused,
        "possibly_disengaged": possibly_disengaged,
        "no_face": no_face,
        "camera_off": camera_off,
        "unknown": unknown_count,
        "overall_engagement_pct": overall_engagement_pct,
        # Live grid from WebSocket manager (anonymized tiles)
        "live_active_students": live_summary["active_students_count"],
        "live_focused": live_summary["focused_count"],
        "live_mild_confusion": live_summary["mild_confusion_count"],
        "live_lost_or_disengaged": live_summary["lost_or_disengaged_count"],
        "comprehension_rate_pct": live_summary["comprehension_rate_pct"],
        "attention_rate_pct": live_summary["attention_rate_pct"],
        "comprehension_drop_alert": live_summary["comprehension_drop_alert"],
        "alert_message": live_summary["alert_message"],
        "tiles": live_summary["tiles"],
        "last_updated": datetime.utcnow().isoformat(),
    }


@router.post("/api/v2/classroom/confusion-bookmark", response_model=ConfusionBookmarkOut)
def create_confusion_bookmark(
    bookmark_in: ConfusionBookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Student clicks 'I got lost here' — bookmarks the timestamp and topic."""
    bookmark = ConfusionBookmark(
        user_id=current_user.id,
        session_id=bookmark_in.session_id,
        topic_or_slide=bookmark_in.topic_or_slide or "Live Lecture",
        note=bookmark_in.note,
        timestamp=datetime.utcnow()
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.get("/api/v2/classroom/my-confusion-bookmarks/{session_id}", response_model=List[ConfusionBookmarkOut])
def get_my_confusion_bookmarks(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches bookmarks for the student (private to this student only)."""
    return db.query(ConfusionBookmark).filter(
        ConfusionBookmark.user_id == current_user.id,
        ConfusionBookmark.session_id == session_id
    ).order_by(ConfusionBookmark.timestamp.asc()).all()


@router.post("/api/v2/classroom/generate-followup/{session_id}", response_model=PostClassFollowupOut)
def trigger_generate_followup(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates personalized post-class follow-up recap or extension challenge."""
    return generate_followup(db, current_user.id, session_id)


@router.get("/api/v2/classroom/my-followups", response_model=List[PostClassFollowupOut])
def get_my_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches student's post-class follow-ups."""
    return db.query(AIRecommendation).filter(
        AIRecommendation.user_id == current_user.id,
        AIRecommendation.type == "followup"
    ).order_by(AIRecommendation.created_at.desc()).all()
