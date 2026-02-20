from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WorkoutLog, User
from schemas import WorkoutLogRequest, WorkoutLogResponse, WorkoutAnalyzeRequest, AIAnalysisResponse
from services.openai_service import analyze_workout

router = APIRouter(prefix="/api/workout", tags=["Workout"])

# MET values for calorie estimation
MET_VALUES = {
    "walking": {"low": 2.5, "moderate": 3.5, "high": 5.0},
    "running": {"low": 6.0, "moderate": 8.0, "high": 11.0},
    "strength": {"low": 3.0, "moderate": 5.0, "high": 8.0},
    "misc": {"low": 2.0, "moderate": 4.0, "high": 6.0},
}


def estimate_workout_calories(workout_type: str, duration_min: float,
                               intensity: str, weight_kg: float) -> float:
    """Estimate calories using MET formula: calories = MET * weight_kg * duration_hours."""
    met_group = MET_VALUES.get(workout_type.lower(), MET_VALUES["misc"])
    met = met_group.get(intensity.lower(), met_group["moderate"])
    duration_hours = duration_min / 60
    calories = met * weight_kg * duration_hours
    return round(calories, 1)


@router.post("/", response_model=WorkoutLogResponse)
def log_workout(req: WorkoutLogRequest, db: Session = Depends(get_db)):
    """Log a workout entry."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    calories = estimate_workout_calories(
        req.workout_type, req.duration_min, req.intensity, user.weight_kg
    )

    log = WorkoutLog(
        user_id=req.user_id,
        workout_type=req.workout_type,
        duration_min=req.duration_min,
        intensity=req.intensity,
        calories_burnt=calories,
        notes=req.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{user_id}", response_model=list[WorkoutLogResponse])
def get_workout_logs(user_id: int, db: Session = Depends(get_db)):
    """Get all workout logs for a user."""
    logs = db.query(WorkoutLog).filter(WorkoutLog.user_id == user_id).order_by(WorkoutLog.created_at.desc()).all()
    return logs


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_workout_endpoint(req: WorkoutAnalyzeRequest, db: Session = Depends(get_db)):
    """Analyze a workout entry using OpenAI."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    workout_log = db.query(WorkoutLog).filter(WorkoutLog.id == req.workout_log_id).first()
    if not workout_log:
        raise HTTPException(status_code=404, detail="Workout log not found.")

    analysis = analyze_workout(
        bmi=user.bmi,
        bmi_category=user.bmi_category,
        weight_kg=user.weight_kg,
        workout_type=workout_log.workout_type,
        duration_min=workout_log.duration_min,
        intensity=workout_log.intensity,
        calories=workout_log.calories_burnt or 0,
    )

    workout_log.ai_analysis = analysis
    db.commit()

    return AIAnalysisResponse(analysis=analysis)
