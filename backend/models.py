from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)  # null for Google-only users
    auth_provider = Column(String(20), default="local")  # "local" or "google"
    google_id = Column(String(255), unique=True, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    bmi_category = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sleep_logs = relationship("SleepLog", back_populates="user")
    steps_logs = relationship("StepsLog", back_populates="user")
    workout_logs = relationship("WorkoutLog", back_populates="user")
    water_logs = relationship("WaterLog", back_populates="user")
    energy_scores = relationship("EnergyScore", back_populates="user")
    weekly_reports = relationship("WeeklyReport", back_populates="user")
    goals = relationship("UserGoal", back_populates="user", uselist=False)


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sleep_time = Column(String(50), nullable=False)
    wake_time = Column(String(50), nullable=False)
    duration_hours = Column(Float, nullable=False)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sleep_logs")


class StepsLog(Base):
    __tablename__ = "steps_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    steps = Column(Integer, nullable=False)
    calories_burnt = Column(Float, nullable=False)
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="steps_logs")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_type = Column(String(50), nullable=False)  # walking, running, strength, misc
    duration_min = Column(Float, nullable=False)
    intensity = Column(String(20), default="moderate")  # low, moderate, high
    calories_burnt = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="workout_logs")


class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    glasses = Column(Integer, nullable=False)
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="water_logs")


class EnergyScore(Base):
    __tablename__ = "energy_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)  # 0-100
    sleep_factor = Column(Float, nullable=True)
    workout_factor = Column(Float, nullable=True)
    details = Column(Text, nullable=True)
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="energy_scores")


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start = Column(String(20), nullable=False)
    week_end = Column(String(20), nullable=False)
    report_text = Column(Text, nullable=False)
    summary_stats = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="weekly_reports")


class UserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    step_goal = Column(Integer, default=10000)
    sleep_goal = Column(Float, default=8.0)
    water_goal = Column(Integer, default=8)
    calorie_goal = Column(Integer, default=2500)

    user = relationship("User", back_populates="goals")
