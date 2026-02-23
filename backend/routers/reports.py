"""Weekly AI Reports router."""
import json
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from auth_utils import get_current_user
from models import User, SleepLog, StepsLog, WorkoutLog, WaterLog, WeeklyReport
from schemas import WeeklyReportResponse
from rate_limiter import get_rate_limited_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _get_week_range():
    """Return (week_start, week_end) as YYYY-MM-DD strings for the current week (Mon–Sun)."""
    today = datetime.utcnow().date()
    start = today - timedelta(days=today.weekday())  # Monday
    end = start + timedelta(days=6)  # Sunday
    return str(start), str(end)


def _aggregate_week_data(db: Session, user_id: int, week_start: str, week_end: str) -> dict:
    """Aggregate all fitness data for the given week."""
    # Sleep
    sleep_logs = (
        db.query(SleepLog)
        .filter(
            SleepLog.user_id == user_id,
            func.date(SleepLog.created_at) >= week_start,
            func.date(SleepLog.created_at) <= week_end,
        )
        .all()
    )
    total_sleep = sum(l.duration_hours for l in sleep_logs)
    avg_sleep = round(total_sleep / len(sleep_logs), 1) if sleep_logs else 0

    # Steps
    step_logs = (
        db.query(StepsLog)
        .filter(StepsLog.user_id == user_id, StepsLog.date >= week_start, StepsLog.date <= week_end)
        .all()
    )
    total_steps = sum(l.steps for l in step_logs)
    total_step_cal = sum(l.calories_burnt for l in step_logs)

    # Workouts
    workout_logs = (
        db.query(WorkoutLog)
        .filter(
            WorkoutLog.user_id == user_id,
            func.date(WorkoutLog.created_at) >= week_start,
            func.date(WorkoutLog.created_at) <= week_end,
        )
        .all()
    )
    total_workout_min = sum(l.duration_min for l in workout_logs)
    total_workout_cal = sum(l.calories_burnt or 0 for l in workout_logs)
    workout_types = {}
    for w in workout_logs:
        workout_types[w.workout_type] = workout_types.get(w.workout_type, 0) + 1

    # Water
    water_logs = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id, WaterLog.date >= week_start, WaterLog.date <= week_end)
        .all()
    )
    total_water = sum(l.glasses for l in water_logs)

    return {
        "week_start": week_start,
        "week_end": week_end,
        "sleep": {
            "total_hours": round(total_sleep, 1),
            "avg_hours": avg_sleep,
            "nights_logged": len(sleep_logs),
        },
        "steps": {
            "total": total_steps,
            "calories": round(total_step_cal, 0),
            "days_logged": len(step_logs),
        },
        "workouts": {
            "total_minutes": round(total_workout_min, 0),
            "calories": round(total_workout_cal, 0),
            "sessions": len(workout_logs),
            "types": workout_types,
        },
        "water": {
            "total_glasses": total_water,
            "days_logged": len(water_logs),
        },
    }


def _generate_report_text(stats: dict, user: User) -> str:
    """Call OpenAI to generate a comprehensive weekly fitness report."""
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

    prompt = f"""You are a certified fitness coach and health advisor. Generate a comprehensive weekly fitness report for the user based on this data:

**User Profile:**
- Name: {user.name}
- BMI: {user.bmi or 'Not set'} ({user.bmi_category or 'N/A'})
- Weight: {user.weight_kg or 'N/A'} kg

**Week: {stats['week_start']} to {stats['week_end']}**

**Sleep:**
- Total: {stats['sleep']['total_hours']} hours across {stats['sleep']['nights_logged']} nights
- Average: {stats['sleep']['avg_hours']} hrs/night

**Steps:**
- Total: {stats['steps']['total']} steps across {stats['steps']['days_logged']} days
- Calories burnt from steps: {stats['steps']['calories']}

**Workouts:**
- {stats['workouts']['sessions']} sessions, {stats['workouts']['total_minutes']} total minutes
- Calories burnt: {stats['workouts']['calories']}
- Types: {stats['workouts']['types'] or 'None'}

**Water Intake:**
- {stats['water']['total_glasses']} glasses across {stats['water']['days_logged']} days

Please provide:
1. **Weekly Overview** – A brief summary of the week
2. **Achievements** – What went well
3. **Areas for Improvement** – Where the user can do better
4. **Recommendations** – Specific, actionable goals for next week
5. **Health Insights** – Any noteworthy health observations

Use markdown formatting with headers, bullet points, and bold text. Keep it encouraging but honest. If there is little data, acknowledge it and encourage consistency."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"**Report Generation Error**\n\nCould not generate AI report: {str(e)}\n\nPlease ensure your OpenAI API key is configured correctly."


@router.post("/weekly", response_model=WeeklyReportResponse)
def generate_weekly_report(
    current_user: User = Depends(get_rate_limited_user),
    db: Session = Depends(get_db),
):
    """Generate a weekly fitness report using AI."""
    week_start, week_end = _get_week_range()

    # Check if a report already exists for this week
    existing = (
        db.query(WeeklyReport)
        .filter(
            WeeklyReport.user_id == current_user.id,
            WeeklyReport.week_start == week_start,
            WeeklyReport.week_end == week_end,
        )
        .first()
    )

    if existing:
        # Regenerate the report text but update in place
        stats = _aggregate_week_data(db, current_user.id, week_start, week_end)
        existing.report_text = _generate_report_text(stats, current_user)
        existing.summary_stats = json.dumps(stats)
        db.commit()
        db.refresh(existing)
        return existing

    # Generate new report
    stats = _aggregate_week_data(db, current_user.id, week_start, week_end)
    report_text = _generate_report_text(stats, current_user)

    report = WeeklyReport(
        user_id=current_user.id,
        week_start=week_start,
        week_end=week_end,
        report_text=report_text,
        summary_stats=json.dumps(stats),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=list[WeeklyReportResponse])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all weekly reports for the user, newest first."""
    return (
        db.query(WeeklyReport)
        .filter(WeeklyReport.user_id == current_user.id)
        .order_by(WeeklyReport.created_at.desc())
        .all()
    )


@router.get("/{report_id}", response_model=WeeklyReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific report by ID."""
    report = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.id == report_id, WeeklyReport.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
