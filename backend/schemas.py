from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── BMI ──────────────────────────────────────────────
class BMIRequest(BaseModel):
    height_cm: float
    weight_kg: float


class BMIResponse(BaseModel):
    user_id: int
    bmi: float
    bmi_category: str
    height_cm: float
    weight_kg: float


# ── Sleep ────────────────────────────────────────────
class SleepLogRequest(BaseModel):
    user_id: int
    sleep_time: str  # e.g. "10:00 PM" or "22:00"
    wake_time: str   # e.g. "6:00 AM" or "06:00"


class SleepLogResponse(BaseModel):
    id: int
    user_id: int
    sleep_time: str
    wake_time: str
    duration_hours: float
    ai_analysis: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SleepAnalyzeRequest(BaseModel):
    user_id: int
    sleep_log_id: int


# ── Steps ────────────────────────────────────────────
class StepsLogRequest(BaseModel):
    user_id: int
    steps: int
    date: str  # "YYYY-MM-DD"


class StepsLogResponse(BaseModel):
    id: int
    user_id: int
    steps: int
    calories_burnt: float
    date: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Workout ──────────────────────────────────────────
class WorkoutLogRequest(BaseModel):
    user_id: int
    workout_type: str  # walking, running, strength, misc
    duration_min: float
    intensity: str = "moderate"  # low, moderate, high
    notes: Optional[str] = None


class WorkoutLogResponse(BaseModel):
    id: int
    user_id: int
    workout_type: str
    duration_min: float
    intensity: str
    calories_burnt: Optional[float] = None
    notes: Optional[str] = None
    ai_analysis: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutAnalyzeRequest(BaseModel):
    user_id: int
    workout_log_id: int


# ── Water ────────────────────────────────────────────
class WaterLogRequest(BaseModel):
    user_id: int
    glasses: int
    date: str


class WaterLogResponse(BaseModel):
    id: int
    user_id: int
    glasses: int
    date: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Energy ───────────────────────────────────────────
class EnergyScoreResponse(BaseModel):
    id: int
    user_id: int
    score: int
    sleep_factor: Optional[float] = None
    workout_factor: Optional[float] = None
    details: Optional[str] = None
    date: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Generic ──────────────────────────────────────────
class AIAnalysisResponse(BaseModel):
    analysis: str
    suggestions: Optional[List[str]] = None
