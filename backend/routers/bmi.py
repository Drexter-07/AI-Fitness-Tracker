from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import BMIRequest, BMIResponse

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
def create_bmi(req: BMIRequest, db: Session = Depends(get_db)):
    """Calculate BMI, create a user profile, and return results."""
    if req.height_cm <= 0 or req.weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Height and weight must be positive numbers.")

    bmi_value, category = calculate_bmi(req.height_cm, req.weight_kg)

    user = User(
        height_cm=req.height_cm,
        weight_kg=req.weight_kg,
        bmi=bmi_value,
        bmi_category=category,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return BMIResponse(
        user_id=user.id,
        bmi=bmi_value,
        bmi_category=category,
        height_cm=req.height_cm,
        weight_kg=req.weight_kg,
    )
