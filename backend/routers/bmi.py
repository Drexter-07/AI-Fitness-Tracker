from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import BMIRequest, BMIResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/api/bmi", tags=["BMI"])


def calculate_bmi(height_cm: float, weight_kg: float) -> tuple[float, str]:
    """Calculate BMI and return (bmi_value, category)."""
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25:
        category = "Normal weight"
    elif bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"

    return bmi, category


@router.post("/", response_model=BMIResponse)
def create_or_update_bmi(
    req: BMIRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate BMI and update the authenticated user's profile."""
    if req.height_cm <= 0 or req.weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Height and weight must be positive numbers.")

    bmi_value, category = calculate_bmi(req.height_cm, req.weight_kg)

    # Update existing user instead of creating a new one
    current_user.height_cm = req.height_cm
    current_user.weight_kg = req.weight_kg
    current_user.bmi = bmi_value
    current_user.bmi_category = category
    db.commit()
    db.refresh(current_user)

    return BMIResponse(
        user_id=current_user.id,
        bmi=bmi_value,
        bmi_category=category,
        height_cm=req.height_cm,
        weight_kg=req.weight_kg,
    )
