from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import SleepLog, User
from schemas import SleepLogRequest, SleepLogResponse, SleepAnalyzeRequest, AIAnalysisResponse
from services.openai_service import analyze_sleep

router = APIRouter(prefix="/api/sleep", tags=["Sleep"])


def parse_time(time_str: str) -> datetime:
    """Parse time string in various formats."""
    formats = ["%I:%M %p", "%I:%M%p", "%I %p", "%I%p", "%H:%M"]
    for fmt in formats:
        try:
            return datetime.strptime(time_str.strip().upper(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Could not parse time: {time_str}")


def compute_duration(sleep_time_str: str, wake_time_str: str) -> float:
    """Compute sleep duration in hours."""
    sleep_t = parse_time(sleep_time_str)
    wake_t = parse_time(wake_time_str)

    # If wake time is earlier than sleep time, assume next day
    diff = (wake_t - sleep_t).total_seconds()
    if diff <= 0:
        diff += 24 * 3600

    return round(diff / 3600, 1)


@router.post("/", response_model=SleepLogResponse)
def log_sleep(req: SleepLogRequest, db: Session = Depends(get_db)):
    """Log a sleep entry."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    duration = compute_duration(req.sleep_time, req.wake_time)

    log = SleepLog(
        user_id=req.user_id,
        sleep_time=req.sleep_time,
        wake_time=req.wake_time,
        duration_hours=duration,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{user_id}", response_model=list[SleepLogResponse])
def get_sleep_logs(user_id: int, db: Session = Depends(get_db)):
    """Get all sleep logs for a user."""
    logs = db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).all()
    return logs


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_sleep_endpoint(req: SleepAnalyzeRequest, db: Session = Depends(get_db)):
    """Analyze a sleep entry using OpenAI."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    sleep_log = db.query(SleepLog).filter(SleepLog.id == req.sleep_log_id).first()
    if not sleep_log:
        raise HTTPException(status_code=404, detail="Sleep log not found.")

    analysis = analyze_sleep(
        bmi=user.bmi,
        bmi_category=user.bmi_category,
        weight_kg=user.weight_kg,
        sleep_time=sleep_log.sleep_time,
        wake_time=sleep_log.wake_time,
        duration_hours=sleep_log.duration_hours,
    )

    # Save analysis to the log
    sleep_log.ai_analysis = analysis
    db.commit()

    return AIAnalysisResponse(analysis=analysis)
