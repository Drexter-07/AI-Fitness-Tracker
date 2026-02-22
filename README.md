# FitTrack AI

A comprehensive fitness tracking application powered by AI to provide personalized health insights, activity logging, and dynamic goal monitoring.


<img width="1801" height="1356" alt="image" src="https://github.com/user-attachments/assets/5eff6611-58f0-4034-8d65-da81b74fd4a4" />



## 🚀 Features

- **Dashboard Overview:** Get a quick glance at your daily metrics including Steps, Sleep, Calories, Water, and Active Workout minutes.
- **Core Trackers:**
  - **Sleep Tracking:** Log simple sleep hours and receive AI-driven quality analysis.
  - **Step Counter:** Monitor daily movement with calculated, weight-adjusted calorie burn.
  - **Workout Log:** Record various exercises (walking, running, strength training) with AI analysis.
  - **Water & Wellness:** Stay hydrated with tracked intake and personalized wellness tips.
  - **Energy Score:** Real-time calculation of your overall readiness based on historical sleep and activity.
- **AI Assistant (CopilotKit):** Natural language processing allows you to chat with an AI coach, update your daily goals hands-free, and receive detailed weekly reports.
- **Customizable Goals:** Set active targets for your steps, sleep duration, and water intake from the Profile page.
- **Premium UI/UX:** Features a sleek dark/light mode toggle, dynamic gradients, smooth animations, and full mobile responsiveness for all devices.
- **Progressive Web App (PWA):** Installable on mobile devices with a native app feel and caching support.
- **Authentication:** Secure local login/registration with integrated UI support for Google SSO.

## 💻 Tech Stack

- **Frontend:** React, Vite, React Router, CSS Variables (Custom Design System), Recharts (Data Visualization), CopilotKit (AI Context & Actions), Vite PWA.
- **Backend:** Python, FastAPI, SQLAlchemy (ORM), SQLite (Database), OpenAI API (Insights/Reports).

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.9+
- OpenAI API Key

### Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables:
   Create a `.env` file in the `backend` directory and add:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will be available at `http://localhost:8000`.*

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `frontend` directory and add your Google Client ID (optional, for SSO):
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

### 📱 Testing the PWA Locally

To test the Progressive Web App installability and service workers, you need to run the production build instead of the dev server:

```bash
npm run build
npm run preview
```
*Open the preview link (usually `http://localhost:4173`) to see the install prompt in your browser address bar.*

## 🔮 Future Roadmap

Check out the `ProjectAnalysisAndFeatures.md` file in the repository root for an outline of future advanced features like Wearable Integrations, Offline-First Background Sync, and Proactive AI coaching.
