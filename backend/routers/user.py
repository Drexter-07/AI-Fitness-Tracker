from fastapi import APIRouter, Depends
from models import User
from routers.auth import get_current_user
from rate_limiter import get_user_remaining_requests

router = APIRouter()

@router.get("/usage")
async def get_usage_stats(user: User = Depends(get_current_user)):
    """Returns the user's subscription tier and remaining OpenAI requests."""
    usage_stats = await get_user_remaining_requests(user.id, user.subscription_tier)
    
    return {
        "tier": user.subscription_tier,
        "limits": usage_stats
    }
