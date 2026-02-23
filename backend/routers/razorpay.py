import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routers.auth import get_current_user
import json

router = APIRouter()

# Initialize Razorpay Client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

# Constants
PRICE_AMOUNT_INR = 2000  # ₹20.00 in paise
PASS_DURATION_DAYS = 7


if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    client = None


@router.post("/create-checkout-session")
async def create_checkout_session(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates a Razorpay Subscription for the user and returns the hosted payment link."""
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay API keys not configured")

    try:
        # Create a one-time 7-day pass payment link
        payment_link_data = {
            "amount": PRICE_AMOUNT_INR,
            "currency": "INR",
            "accept_partial": False,
            "description": "FitTrack AI - 7-Day Premium Pass",
            "customer": {
                "name": user.name,
                "email": user.email
            },
            "notify": {
                "sms": False,
                "email": True
            },
            "reminder_enable": False,
            "notes": {
                "user_id": str(user.id)
            },
            "callback_url": "http://localhost:5173/profile?razorpay=success",
            "callback_method": "get"
        }
        
        payment_link = client.payment_link.create(payment_link_data)
        
        short_url = payment_link.get("short_url")
        
        if not short_url:
            raise Exception("Failed to generate Razorpay Payment Link")
            
        return {"url": short_url}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handles Razorpay webhooks to upgrade users when subscription is charged."""
    if not client or not RAZORPAY_WEBHOOK_SECRET:
         raise HTTPException(status_code=500, detail="Razorpay webhook secret not configured")
         
    payload = await request.body()
    sig_header = request.headers.get("x-razorpay-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        # Verify webhook signature using Razorpay SDK
        client.utility.verify_webhook_signature(
            payload.decode('utf-8'),
            sig_header,
            RAZORPAY_WEBHOOK_SECRET
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Verification failed")

    # Parse JSON payload
    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Handle the one-time payment link successful charge
    if event.get("event") == "payment_link.paid" or event.get("event") == "order.paid":
        payload_entity = event.get("payload", {}).get("payment_link", {}).get("entity", {})
        
        # Fallback to order if payment_link structure isn't exactly as expected
        if not payload_entity:
            payload_entity = event.get("payload", {}).get("order", {}).get("entity", {})
            
        notes = payload_entity.get("notes", {})
        user_id = notes.get("user_id")
        
        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                from datetime import datetime, timedelta
                # Give user the weekly pass
                user.subscription_tier = "WEEKLY"
                # Set expiration to 7 days from right now
                user.subscription_expires_at = datetime.utcnow() + timedelta(days=PASS_DURATION_DAYS)
                
                db.commit()
                print(f"Successfully upgraded user {user_id} to 7-Day Pass via Razorpay")

    return {"status": "success"}


@router.post("/verify-payment")
async def verify_razorpay_payment(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Manually verifies if the user has a successfully paid Payment Link.
    This acts as a fallback for local development where Webhooks cannot reach localhost.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay API not configured")
        
    try:
        # Fetch recent payment links. We don't have the exact ID here, 
        # but we can query Razorpay for recent links and match the user_id in notes.
        from datetime import datetime, timedelta
        
        # We query the last 10 payment links. In a real production system, 
        # you'd pass the specific payment_link_id from the frontend.
        links = client.payment_link.all({"count": 10})
        # Razorpay SDK returns a dictionary containing a 'payment_links' array, not 'items'
        items = links.get("payment_links", links.get("items", []))
        
        for link in items:
            notes = link.get("notes", {})
            status = link.get("status")
            print(f"Link ID: {link.get('id')}, Status: {status}, Notes: {notes}")
            if notes.get("user_id") == str(user.id) and status == "paid":
                # Only upgrade if they aren't already upgraded to avoid stacking dates incorrectly
                if user.subscription_tier != "WEEKLY":
                    user.subscription_tier = "WEEKLY"
                    user.subscription_expires_at = datetime.utcnow() + timedelta(days=PASS_DURATION_DAYS)
                    db.commit()
                    
                    # Forcefully reset the user's daily rate limit counter in Redis 
                    # so they instantly get their 50 requests instead of being stuck at 20.
                    from rate_limiter import redis_client
                    current_date = datetime.utcnow().strftime("%Y-%m-%d")
                    redis_key = f"rate_limit:openai:{user.id}:{current_date}"
                    await redis_client.delete(redis_key)
                    
                    return {"status": "success", "message": "Pass activated successfully"}
                else:
                    return {"status": "success", "message": "Pass already active"}
                    
        return {"status": "pending", "message": "No successful payment found yet."}
        
    except Exception as e:
        print(f"Error manually verifying payment: {e}")
        raise HTTPException(status_code=400, detail="Could not verify payment status")
