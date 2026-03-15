from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WaterLog, User
from schemas import WaterLogRequest, WaterLogResponse, AIAnalysisResponse
from services.openai_service import get_fitness_suggestions
from auth_utils import get_current_user
from rate_limiter import get_rate_limited_user

router = APIRouter(prefix="/api/water", tags=["Water"])


@router.post("/", response_model=WaterLogResponse)
def log_water(
    req: WaterLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log water intake for the authenticated user."""
    log = WaterLog(
        user_id=current_user.id,
        glasses=req.glasses,
        date=req.date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/", response_model=list[WaterLogResponse])
def get_water_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all water logs for the authenticated user."""
    logs = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id
    ).order_by(WaterLog.created_at.desc()).all()
    return logs


@router.get("/analyze", response_model=AIAnalysisResponse)
def analyze_water_endpoint(
    current_user: User = Depends(get_rate_limited_user),
    db: Session = Depends(get_db),
):
    """Generate generic fitness & hydration suggestions."""
    from datetime import datetime
    
    # Get today's total water intake
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    logs_today = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == today_str
    ).all()
    
    total_glasses = sum([log.glasses for log in logs_today])
    
    analysis = get_fitness_suggestions(
        bmi=current_user.bmi or 0.0,
        bmi_category=current_user.bmi_category or "Unknown",
        weight_kg=current_user.weight_kg or 0.0,
        water_glasses=total_glasses,
        recent_activities="General tracking"
    )
    
    return AIAnalysisResponse(analysis=analysis)
