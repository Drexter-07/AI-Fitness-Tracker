from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WaterLog, User
from schemas import WaterLogRequest, WaterLogResponse
from auth_utils import get_current_user

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
