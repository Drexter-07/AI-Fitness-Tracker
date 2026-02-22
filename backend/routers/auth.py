from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    RegisterRequest, LoginRequest, GoogleAuthRequest,
    AuthResponse, UserProfileResponse,
)
from auth_utils import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # Validate
    if not req.email or not req.password or not req.name:
        raise HTTPException(status_code=400, detail="All fields are required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Check if email already taken
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        email=req.email.lower().strip(),
        name=req.name.strip(),
        password_hash=hash_password(req.password),
        auth_provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token, user=UserProfileResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.password_hash:
        raise HTTPException(
            status_code=401,
            detail="This account uses Google sign-in. Please use Google to log in.",
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token, user=UserProfileResponse.model_validate(user))


@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Login or register using a Google access token or ID token."""
    try:
        import requests as http_requests

        # Try as access token first (from useGoogleLogin implicit flow)
        userinfo_response = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {req.token}"},
        )

        if userinfo_response.status_code == 200:
            idinfo = userinfo_response.json()
            google_id = idinfo.get("sub", "")
            email = idinfo.get("email", "").lower()
            name = idinfo.get("name", email.split("@")[0])
        else:
            # Fallback: try as ID token
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            import os

            client_id = os.getenv("GOOGLE_CLIENT_ID", "")
            idinfo = id_token.verify_oauth2_token(
                req.token, google_requests.Request(), client_id
            )
            google_id = idinfo["sub"]
            email = idinfo.get("email", "").lower()
            name = idinfo.get("name", email.split("@")[0])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

    if not google_id or not email:
        raise HTTPException(status_code=401, detail="Could not retrieve Google profile info.")

    # Check if user already exists by google_id or email
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

    if user:
        # Update google_id if missing (user registered with email first)
        if not user.google_id:
            user.google_id = google_id
            user.auth_provider = "google"
            db.commit()
    else:
        # Create new user
        user = User(
            email=email,
            name=name,
            auth_provider="google",
            google_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token, user=UserProfileResponse.model_validate(user))


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserProfileResponse.model_validate(current_user)


@router.get("/profile/stats")
def get_profile_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregate stats for the user's profile page."""
    from models import SleepLog, StepsLog, WorkoutLog, WaterLog

    return {
        "sleep_count": db.query(SleepLog).filter(SleepLog.user_id == current_user.id).count(),
        "steps_count": db.query(StepsLog).filter(StepsLog.user_id == current_user.id).count(),
        "workout_count": db.query(WorkoutLog).filter(WorkoutLog.user_id == current_user.id).count(),
        "water_count": db.query(WaterLog).filter(WaterLog.user_id == current_user.id).count(),
    }
