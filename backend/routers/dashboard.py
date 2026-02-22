"""Dashboard aggregation endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from auth_utils import get_current_user
from models import User, SleepLog, StepsLog, WorkoutLog, WaterLog

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/today")
def get_today_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate today's fitness data for the authenticated user."""
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Sleep – sum duration_hours logged today
    sleep_hours = (
        db.query(func.coalesce(func.sum(SleepLog.duration_hours), 0.0))
        .filter(SleepLog.user_id == current_user.id)
        .filter(func.date(SleepLog.created_at) == today)
        .scalar()
    )

    # Steps – sum steps logged today
    steps = (
        db.query(func.coalesce(func.sum(StepsLog.steps), 0))
        .filter(StepsLog.user_id == current_user.id, StepsLog.date == today)
        .scalar()
    )

    # Calories from steps
    step_calories = (
        db.query(func.coalesce(func.sum(StepsLog.calories_burnt), 0.0))
        .filter(StepsLog.user_id == current_user.id, StepsLog.date == today)
        .scalar()
    )

    # Workout minutes today
    workout_minutes = (
        db.query(func.coalesce(func.sum(WorkoutLog.duration_min), 0.0))
        .filter(WorkoutLog.user_id == current_user.id)
        .filter(func.date(WorkoutLog.created_at) == today)
        .scalar()
    )

    # Workout calories
    workout_calories = (
        db.query(func.coalesce(func.sum(WorkoutLog.calories_burnt), 0.0))
        .filter(WorkoutLog.user_id == current_user.id)
        .filter(func.date(WorkoutLog.created_at) == today)
        .scalar()
    )

    # Water glasses today
    water_glasses = (
        db.query(func.coalesce(func.sum(WaterLog.glasses), 0))
        .filter(WaterLog.user_id == current_user.id, WaterLog.date == today)
        .scalar()
    )

    return {
        "sleep_hours": round(float(sleep_hours), 1),
        "steps": int(steps),
        "calories_burnt": round(float(step_calories) + float(workout_calories), 0),
        "water_glasses": int(water_glasses),
        "workout_minutes": round(float(workout_minutes), 0),
    }
