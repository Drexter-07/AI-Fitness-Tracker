from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
from models import EnergyScore, User, SleepLog, WorkoutLog
from schemas import EnergyScoreResponse

router = APIRouter(prefix="/api/energy", tags=["Energy Score"])


def compute_energy_score(sleep_logs: list, workout_logs: list) -> tuple[int, float, float, str]:
    """Compute energy score (0-100) based on recent sleep and workout data.

    Returns (score, sleep_factor, workout_factor, details).
    """
    # Sleep factor (0-50 points)
    sleep_factor = 0.0
    if sleep_logs:
        avg_duration = sum(s.duration_hours for s in sleep_logs) / len(sleep_logs)
        # Ideal sleep is 7-9 hours
        if 7 <= avg_duration <= 9:
            sleep_factor = 50.0
        elif 6 <= avg_duration < 7 or 9 < avg_duration <= 10:
            sleep_factor = 35.0
        elif 5 <= avg_duration < 6:
            sleep_factor = 20.0
        else:
            sleep_factor = 10.0
    else:
        sleep_factor = 25.0  # neutral if no data

    # Workout factor (0-50 points)
    workout_factor = 0.0
    if workout_logs:
        total_minutes = sum(w.duration_min for w in workout_logs)
        workout_days = len(workout_logs)

        # Score based on weekly activity
        if total_minutes >= 150 and workout_days >= 3:
            workout_factor = 50.0
        elif total_minutes >= 90 and workout_days >= 2:
            workout_factor = 35.0
        elif total_minutes >= 30:
            workout_factor = 20.0
        else:
            workout_factor = 10.0
    else:
        workout_factor = 25.0  # neutral if no data

    score = int(sleep_factor + workout_factor)

    # Build details
    details_parts = []
    if sleep_logs:
        avg_d = sum(s.duration_hours for s in sleep_logs) / len(sleep_logs)
        details_parts.append(f"Avg sleep: {avg_d:.1f}h over {len(sleep_logs)} nights")
    else:
        details_parts.append("No sleep data recorded")

    if workout_logs:
        total_min = sum(w.duration_min for w in workout_logs)
        details_parts.append(f"Total workout: {total_min:.0f} min over {len(workout_logs)} sessions")
    else:
        details_parts.append("No workout data recorded")

    details = " | ".join(details_parts)

    return score, sleep_factor, workout_factor, details


@router.get("/{user_id}", response_model=EnergyScoreResponse)
def get_energy_score(user_id: int, db: Session = Depends(get_db)):
    """Compute and return the energy score for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Get recent sleep and workout logs (last 7 entries)
    recent_sleep = db.query(SleepLog).filter(
        SleepLog.user_id == user_id
    ).order_by(SleepLog.created_at.desc()).limit(7).all()

    recent_workouts = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == user_id
    ).order_by(WorkoutLog.created_at.desc()).limit(7).all()

    score, sleep_f, workout_f, details = compute_energy_score(recent_sleep, recent_workouts)

    today = date.today().isoformat()

    energy = EnergyScore(
        user_id=user_id,
        score=score,
        sleep_factor=sleep_f,
        workout_factor=workout_f,
        details=details,
        date=today,
    )
    db.add(energy)
    db.commit()
    db.refresh(energy)

    return energy
