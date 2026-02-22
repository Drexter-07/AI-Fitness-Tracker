"""User Goals endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth_utils import get_current_user
from models import User, UserGoal
from schemas import GoalRequest, GoalResponse

router = APIRouter(prefix="/api/goals", tags=["goals"])

@router.get("/", response_model=GoalResponse)
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current goals for the authenticated user."""
    goal = db.query(UserGoal).filter(UserGoal.user_id == current_user.id).first()
    if not goal:
        # Create default goals if they don't exist
        goal = UserGoal(user_id=current_user.id)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal

@router.put("/", response_model=GoalResponse)
def update_goals(
    request: GoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update goals for the authenticated user."""
    goal = db.query(UserGoal).filter(UserGoal.user_id == current_user.id).first()
    if not goal:
        goal = UserGoal(user_id=current_user.id)
        db.add(goal)
    
    if request.step_goal is not None:
        goal.step_goal = request.step_goal
    if request.sleep_goal is not None:
        goal.sleep_goal = request.sleep_goal
    if request.water_goal is not None:
        goal.water_goal = request.water_goal
    if request.calorie_goal is not None:
        goal.calorie_goal = request.calorie_goal
        
    db.commit()
    db.refresh(goal)
    return goal
