from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import bmi, sleep, steps, workout, water, energy

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitTrack AI",
    description="AI-powered fitness tracking API with personalized health insights",
    version="1.0.0",
)

# CORS – allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(bmi.router)
app.include_router(sleep.router)
app.include_router(steps.router)
app.include_router(workout.router)
app.include_router(water.router)
app.include_router(energy.router)


@app.get("/")
def root():
    return {"message": "FitTrack AI API is running", "docs": "/docs"}
