# FitTrack AI - Features

FitTrack AI is a comprehensive, intelligent fitness tracking application tailored to provide personalized health insights using state-of-the-art AI. Here is an overview of the core functionalities:

## 1. Core Tracking Modules
- **Body Mass Index (BMI):** Calculates and categorizes BMI based on height and weight, using intuitive, color-coded badges (e.g., Normal, Overweight).
- **Sleep Log:** Tracks sleep and wake times, automatically calculating duration.
- **Water Logs:** Tracks daily hydration levels via a simple "glasses consumed" counter.
- **Step Tracking:** Keeps a historical log of daily step counts.
- **Workout Tracking:** Records specific exercises, durations, muscle groups, and calorie burns.

## 2. Interactive Dashboards & Visualizations
- **Data Visualization Charts:** Utilizes Recharts to present beautiful, Dark-Themed Area and Bar charts for history trends (Steps, Sleep, Water).
- **Today's Overview:** A unified central dashboard that pulls the latest entry from every tracking module to give users a high-level summary of their daily progress against their goals.
- **Dynamic Goals:** Customizable user targets (e.g., 10,000 steps, 8 hours sleep) with visual progress bars updating in real time.

## 3. Agentic CopilotKit AI Integration
- **Context-Aware Chat:** A CopilotKit sliding sidebar that has real-time access to the user's database records. 
- **AI Analytics:** The AI can instantly analyze a user's past week of sleep, workouts, or water intake to provide bespoke health recommendations.
- **Actionable AI:** The AI can take actions on behalf of the user, such as automatically adjusting their step goals or sleep targets if instructed to via chat.

## 4. Advanced Rate Limiting Architecture
- **Token Buckets:** Integrates Redis to provide a highly performant Fixed Window Counter rate limiter.
- **Copilot Proxy:** Routes all CopilotKit AI requests through a secure FastAPI proxy, allowing the backend to intercept and rate-limit WebSocket and SSE AI streaming natively without locking down standard API calls.

## 5. Razorpay Subscription Monetization
- **Hosted Payment Links:** Utilizes Razorpay API to generate secure, one-time 7-Day Pass checkout sessions.
- **Intelligent Verification Failsafe:** Combines both webhooks and a silent frontend-driven `/verify-payment` mechanism. This guarantees that if a user's browser drops the redirect URL, the React app will still autonomously verify their payment with the backend and unlock their quota safely.

## 6. Enterprise-Grade Security
- **JWT Authentication:** Stateful user sessions protected by secure Bearer tokens.
- **Password Hashing:** Uses bcrypt to hash and salt user passwords upon registration.
- **Google SSO:** (Architected for integration) Provides secure OAuth2 login pathways.
