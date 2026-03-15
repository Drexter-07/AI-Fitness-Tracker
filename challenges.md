# Developer Challenges & Technical Solutions

Building a robust, AI-driven, monetized web application involves overcoming several distinct system design challenges. Here is a summary of the toughest hurdles we faced and how we engineered solutions for them:

## 1. The CopilotKit Rate Limiting Dilemma
**The Challenge:** 
CopilotKit's frontend SDK initiates AI requests by talking directly to the OpenAI models via a Node server or local runtime endpoint. However, we needed to strictly limit users to 20 requests/day, which meant we had to find a way to trap and count those requests on our FastAPI backend *before* they reached the AI. Furthermore, CopilotKit sends frequent "Sync" payload requests (to keep context updated) which shouldn't count against a user's quota.

**The Solution:** 
We built a custom FastAPI Reverse Proxy (`routers/copilot.py`). The React frontend was configured to point its `runtimeUrl` at our backend proxy. We built a JSON parsing layer that inspects the Copilot RPC payload. If the payload indicates an actual AI generation (`agent/run` or `messages` populated), we ping the Redis counter. If it is just a background context sync, we let it pass for free. We then streamed the `httpx` response back to the client cleanly.

## 2. Breaking CopilotKit's Infinite Retry Loop
**The Challenge:** 
When a user exceeded their 20 limits, our API returned an HTTP `429 Too Many Requests`. However, the CopilotKit SDK is designed to be highly resilient; upon seeing a 429, it assumed the server was just busy and immediately retried the request in an infinite loop, crashing the browser and spamming our server logs.

**The Solution:** 
We discovered that CopilotKit only respects the `403 Forbidden` status code for hard stops. First, we changed our backend `rate_limiter` to throw a `403` instead of a `429`. Second, we implemented a custom `window.fetch` interceptor in `App.jsx`. If the proxy returns a 403, our interceptor forcefully throws a `DOMException('Rate Limit Exceeded', 'AbortError')`. This elegantly kills the underlying Promise chain without triggering React Error Boundaries, giving the user a clean failure state.

## 3. SQLite "Database is Locked" Concurrency
**The Challenge:** 
While testing CopilotKit's heavy AI requests alongside standard Dashboard API fetching, we frequently hit `sqlite3.OperationalError: database is locked`. SQLite struggles with multiple concurrent threads trying to write at the exact same moment.

**The Solution:** 
We adjusted the generic `create_engine` SQLAlchemy setup in `database.py`. We appended `connect_args={"check_same_thread": False}` and `poolclass=StaticPool` so that FastAPI's fully asynchronous worker threads could safely share the connection pool without locking each other out during heavy AI streaming sessions.

## 4. Razorpay Webhooks vs Localhost Reality
**The Challenge:** 
When we migrated from Stripe to Razorpay for our Indian user demographic, we relied on Webhooks to upgrade the user's `subscription_tier` when they successfully bought a 7-day pass. However, because the development environment was hosted on `localhost:8000`, the Razorpay internet servers physically could not reach our laptop to deliver the "Payment Successful" webhook message.

**The Solution:** 
Rather than forcing the use of Ngrok tunnels for local testing, we built an "Explicit Frontend Verification Architecture". We added a `callback_url` to the Razorpay link to force users back to our Profile page upon payment. If the React frontend detects `?razorpay=success`, it silently pings a custom `/verify-payment` endpoint. This Python endpoint reaches out to Razorpay, queries the user's latest payment links locally, and upgrades the database manually, completely bypassing the need for webhooks.

## 5. The Redis Cache Stacking Bug
**The Challenge:** 
Even after Razorpay upgraded a user's database entry to `WEEKLY`, their AI limit was still hardcapped at 20. This occurred because Redis (which tracks daily limits) caches limits the moment a user signs in for the day, and it ignores subsequent database updates.

**The Solution:** 
Inside the Razorpay success verification function, the exact millisecond the Database is upgraded, we implemented a forced cache eviction. The python code actively deletes the specific user's daily Redis key (`await redis_client.delete(f"rate_limit:openai:{user.id}:{date}")`). This forces Redis to recalculate from scratch on the very next AI request, instantly granting the user their new 50 request quota.
