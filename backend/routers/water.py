from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WaterLog, User, WorkoutLog, StepsLog
from schemas import WaterLogRequest, WaterLogResponse, AIAnalysisResponse
from services.openai_service import get_fitness_suggestions

router = APIRouter(prefix="/api/water", tags=["Water & Fitness"])


@router.post("/", response_model=WaterLogResponse)
def log_water(req: WaterLogRequest, db: Session = Depends(get_db)):
    """Log water intake."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    log = WaterLog(
        user_id=req.user_id,
        glasses=req.glasses,
        date=req.date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{user_id}", response_model=list[WaterLogResponse])
def get_water_logs(user_id: int, db: Session = Depends(get_db)):
    """Get water logs for a user."""
    logs = db.query(WaterLog).filter(WaterLog.user_id == user_id).order_by(WaterLog.created_at.desc()).all()
    return logs


@router.get("/suggestions/{user_id}", response_model=AIAnalysisResponse)
def get_suggestions(user_id: int, db: Session = Depends(get_db)):
    """Get AI-generated hydration and fitness suggestions."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Get today's water intake
    water_logs = db.query(WaterLog).filter(WaterLog.user_id == user_id).all()
    total_glasses = sum(w.glasses for w in water_logs) if water_logs else 0

    # Get recent activities summary
    recent_workouts = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == user_id
    ).order_by(WorkoutLog.created_at.desc()).limit(5).all()

    recent_steps = db.query(StepsLog).filter(
        StepsLog.user_id == user_id
    ).order_by(StepsLog.created_at.desc()).limit(5).all()

    activities = []
    for w in recent_workouts:
        activities.append(f"{w.workout_type} for {w.duration_min} min ({w.intensity})")
    for s in recent_steps:
        activities.append(f"{s.steps} steps on {s.date}")

    recent_str = "; ".join(activities) if activities else "No recent activities recorded"

    analysis = get_fitness_suggestions(
        bmi=user.bmi,
        bmi_category=user.bmi_category,
        weight_kg=user.weight_kg,
        water_glasses=total_glasses,
        recent_activities=recent_str,
    )

    return AIAnalysisResponse(analysis=analysis)
