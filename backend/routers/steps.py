from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import StepsLog, User
from schemas import StepsLogRequest, StepsLogResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/api/steps", tags=["Steps"])


def estimate_calories(steps: int, weight_kg: float) -> float:
    """Rough calorie estimate: ~0.04 cal per step per kg."""
    return round(steps * 0.04 * (weight_kg / 70), 1)


@router.post("/", response_model=StepsLogResponse)
def log_steps(
    req: StepsLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a step count entry for the authenticated user."""
    cals = estimate_calories(req.steps, current_user.weight_kg or 70)

    log = StepsLog(
        user_id=current_user.id,
        steps=req.steps,
        calories_burnt=cals,
        date=req.date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/", response_model=list[StepsLogResponse])
def get_steps_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all step logs for the authenticated user."""
    logs = db.query(StepsLog).filter(
        StepsLog.user_id == current_user.id
    ).order_by(StepsLog.created_at.desc()).all()
    return logs
