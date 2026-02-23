from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import SleepLog, User
from schemas import SleepLogRequest, SleepLogResponse, SleepAnalyzeRequest, AIAnalysisResponse
from services.openai_service import analyze_sleep
from auth_utils import get_current_user
from rate_limiter import get_rate_limited_user

router = APIRouter(prefix="/api/sleep", tags=["Sleep"])


def parse_duration(sleep_time: str, wake_time: str) -> float:
    """Parse sleep/wake times and return duration in hours."""
    from datetime import datetime

    formats = ["%I:%M %p", "%H:%M"]
    st = wt = None
    for fmt in formats:
        try:
            st = datetime.strptime(sleep_time.strip().upper(), fmt)
            break
        except ValueError:
            continue
    for fmt in formats:
        try:
            wt = datetime.strptime(wake_time.strip().upper(), fmt)
            break
        except ValueError:
            continue

    if not st or not wt:
        return 8.0  # default

    diff = (wt - st).total_seconds() / 3600
    if diff < 0:
        diff += 24
    return round(diff, 1)


@router.post("/", response_model=SleepLogResponse)
def log_sleep(
    req: SleepLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a sleep entry for the authenticated user."""
    duration = parse_duration(req.sleep_time, req.wake_time)

    log = SleepLog(
        user_id=current_user.id,
        sleep_time=req.sleep_time,
        wake_time=req.wake_time,
        duration_hours=duration,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/", response_model=list[SleepLogResponse])
def get_sleep_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all sleep logs for the authenticated user."""
    logs = db.query(SleepLog).filter(
        SleepLog.user_id == current_user.id
    ).order_by(SleepLog.created_at.desc()).all()
    return logs


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_sleep_endpoint(
    req: SleepAnalyzeRequest,
    current_user: User = Depends(get_rate_limited_user),
    db: Session = Depends(get_db),
):
    """Analyze a sleep entry using OpenAI."""
    sleep_log = db.query(SleepLog).filter(
        SleepLog.id == req.sleep_log_id,
        SleepLog.user_id == current_user.id,
    ).first()
    if not sleep_log:
        raise HTTPException(status_code=404, detail="Sleep log not found.")

    analysis = analyze_sleep(
        bmi=current_user.bmi or 0.0,
        bmi_category=current_user.bmi_category or "Unknown",
        weight_kg=current_user.weight_kg or 0.0,
        sleep_time=sleep_log.sleep_time,
        wake_time=sleep_log.wake_time,
        duration_hours=sleep_log.duration_hours,
    )

    sleep_log.ai_analysis = analysis
    db.commit()

    return AIAnalysisResponse(analysis=analysis)
