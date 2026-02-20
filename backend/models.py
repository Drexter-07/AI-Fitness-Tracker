from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    bmi_category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sleep_logs = relationship("SleepLog", back_populates="user")
    steps_logs = relationship("StepsLog", back_populates="user")
    workout_logs = relationship("WorkoutLog", back_populates="user")
    water_logs = relationship("WaterLog", back_populates="user")
    energy_scores = relationship("EnergyScore", back_populates="user")


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
