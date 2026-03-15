import httpx
import json
from fastapi import APIRouter, Depends, Request, Response, HTTPException
from fastapi.responses import StreamingResponse
from models import User
from routers.auth import get_current_user
from rate_limiter import check_rate_limit

router = APIRouter()

# The internal URL of the copilot-runtime Node.js server
COPILOT_NODE_SERVER = "http://localhost:4000/copilotkit"

@router.post("")
@router.post("/{path:path}")
@router.get("")
@router.get("/{path:path}")
async def proxy_copilotkit(
    request: Request,
    path: str = "",
    user: User = Depends(get_current_user)
):
    """
    Reverse proxy for CopilotKit.
    Authenticates the user, enforces the Redis rate limit, and then streams the request/response 
    to the underlying standalone Node.js copilot-runtime.
    """
    # 1. Inspect request body to determine if this is an actual AI Completion vs Initial Sync
    req_body = await request.body()
    
    is_chat_request = False
    if request.method == "POST":
        try:
            body_json = json.loads(req_body.decode('utf-8'))
            
            # CopilotKit v1.5 sends RPC-style JSON for chat completions.
            # E.g., {'method': 'agent/run', 'body': {'messages': [...]}}
            method_name = body_json.get("method", "")
            
            # Identify if this is a chat completion payload vs structural sync (e.g. /info)
            if method_name in ["agent/run", "agent/chat", "chat"]:
                is_chat_request = True
            elif "body" in body_json and isinstance(body_json["body"], dict) and "messages" in body_json["body"]:
                if len(body_json["body"]["messages"]) > 0:
                    is_chat_request = True
            elif "messages" in body_json and len(body_json["messages"]) > 0:
                is_chat_request = True # Fallback for non-RPC older versions
                
        except Exception:
            # If not JSON or failed to parse, assume it's a standard POST and enforce rate-limit to be safe
            is_chat_request = True

    # Enforce Rate Limiting ONLY for actual chat requests to avoid blocking the UI Agent sync
    if is_chat_request and "info" not in path:
        try:
            await check_rate_limit(user.id, user.subscription_tier)
        except HTTPException as e:
            # CopilotKit SDK will receive a 403. We will handle the retry logic on the frontend.
            return Response(content=e.detail, status_code=403, media_type="text/plain")
    
    # 2. Forward request to Node.js server
    url = COPILOT_NODE_SERVER
    if path:
        url = f"{url}/{path}"
        
    # Exclude headers that can cause proxy issues
    excluded_headers = ["host", "content-length", "authorization"]
    headers = {k: v for k, v in request.headers.items() if k.lower() not in excluded_headers}
    
    try:
        # AI requests can take a long time, so we need a high timeout
        client = httpx.AsyncClient(timeout=httpx.Timeout(120.0))
        req = client.build_request(
            method=request.method,
            url=url,
            headers=headers,
            content=req_body
        )
        
        # Don't buffer the response to allow Copilot streaming
        response = await client.send(req, stream=True)
        
        async def stream_body():
            try:
                async for chunk in response.aiter_raw():
                    yield chunk
            except Exception as e:
                print(f"Error while streaming chunks: {e}")
            finally:
                await response.aclose()
                await client.aclose()
                
        return StreamingResponse(
            stream_body(),
            status_code=response.status_code,
            headers={k: v for k, v in response.headers.items() if k.lower() not in ["transfer-encoding", "content-encoding"]}
        )
    except Exception as exc:
        print(f"Copilot Proxy Exception: {exc}")
        return Response(content=f"Proxy Error: {exc}", status_code=500)
