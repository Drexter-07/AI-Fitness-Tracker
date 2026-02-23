import os
from datetime import datetime
import redis.asyncio as redis
from fastapi import HTTPException, status, Depends
from routers.auth import get_current_user

# Initialize Redis connection
# In production, this should be an environment variable
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Define tier limits (requests per day)
TIER_LIMITS = {
    "FREE": 20,
    "WEEKLY": 50
}

async def check_rate_limit(user_id: int, subscription_tier: str) -> dict:
    """
    Fixed Window rate limiting algorithm using Redis.
    Tracks OpenAI requests per user, per day.
    Returns a dict with 'remaining' and 'limit' if successful.
    Raises HTTPException 429 if the limit is exceeded.
    """
    current_date = datetime.utcnow().strftime("%Y-%m-%d")
    redis_key = f"rate_limit:openai:{user_id}:{current_date}"
    
    # Determine the cap based on the user's tier
    tier = subscription_tier.upper()
    limit = TIER_LIMITS.get(tier, TIER_LIMITS["FREE"])
    
    # 1. Fetch current usage without incrementing yet
    current_usage_str = await redis_client.get(redis_key)
    current_usage = int(current_usage_str) if current_usage_str else 0
    
    # 2. Check limit before incrementing (prevents runaway retries blowing up the counter)
    if current_usage >= limit:
        # Returning 403 Forbidden instead of 429 Too Many Requests
        # CopilotKit client aggressively retries 429s, but stops on 403s!
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Rate limit exceeded. Your {tier} tier allows {limit} AI requests per day."
        )
        
    # 3. Only increment if under the limit
    new_usage = await redis_client.incr(redis_key)
    
    # If this is the first request of the day, set expiration to 24 + 1 hours
    if new_usage == 1:
        await redis_client.expire(redis_key, 25 * 3600)
        
    remaining = limit - new_usage
    
    return {"limit": limit, "remaining": remaining}

async def get_user_remaining_requests(user_id: int, subscription_tier: str) -> dict:
    """
    Helper function to simply fetch the current usage without incrementing.
    Used for the frontend Usage display.
    """
    current_date = datetime.utcnow().strftime("%Y-%m-%d")
    redis_key = f"rate_limit:openai:{user_id}:{current_date}"
    
    tier = subscription_tier.upper()
    limit = TIER_LIMITS.get(tier, TIER_LIMITS["FREE"])
    
    current_usage_str = await redis_client.get(redis_key)
    current_usage = int(current_usage_str) if current_usage_str else 0
    
    remaining = max(0, limit - current_usage)
    return {"limit": limit, "remaining": remaining, "used": current_usage}

async def get_rate_limited_user(user = Depends(get_current_user)):
    """FastAPI dependency to automatically check rate limit before routing."""
    await check_rate_limit(user.id, user.subscription_tier)
    return user

