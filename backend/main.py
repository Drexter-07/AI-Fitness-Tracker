from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, dashboard, sleep, steps, workout, water, energy, reports, bmi, goals, razorpay, user, copilot
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
app.include_router(auth.router)
app.include_router(bmi.router)
app.include_router(sleep.router)
app.include_router(steps.router)
app.include_router(workout.router)
app.include_router(water.router)
app.include_router(energy.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(goals.router)
app.include_router(razorpay.router, prefix="/api/razorpay", tags=["razorpay"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(copilot.router, prefix="/api/copilotkit", tags=["CopilotKit"])


@app.get("/")
def root():
    return {"message": "FitTrack AI API is running", "docs": "/docs"}
