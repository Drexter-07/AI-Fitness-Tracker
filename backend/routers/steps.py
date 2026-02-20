from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import StepsLog, User
from schemas import StepsLogRequest, StepsLogResponse

router = APIRouter(prefix="/api/steps", tags=["Steps"])


def estimate_calories(steps: int, weight_kg: float) -> float:
    """Estimate calories burnt from steps using weight-based formula.

    Approximate: 0.04 kcal per step per kg of body weight (walking avg pace).
    Simplified: calories = steps * 0.04 * (weight_kg / 70)
    """
    base_cal_per_step = 0.04
    weight_factor = weight_kg / 70  # normalized to 70 kg
    calories = steps * base_cal_per_step * weight_factor
    return round(calories, 1)


@router.post("/", response_model=StepsLogResponse)
def log_steps(req: StepsLogRequest, db: Session = Depends(get_db)):
    """Log steps for a user."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    calories = estimate_calories(req.steps, user.weight_kg)

    log = StepsLog(
        user_id=req.user_id,
        steps=req.steps,
        calories_burnt=calories,
        date=req.date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{user_id}", response_model=list[StepsLogResponse])
def get_steps_logs(user_id: int, db: Session = Depends(get_db)):
    """Get all step logs for a user."""
    logs = db.query(StepsLog).filter(StepsLog.user_id == user_id).order_by(StepsLog.created_at.desc()).all()
    return logs
