# 🏎️ PitLane IQ

**Next-Generation F1 Race Intelligence & Strategy Platform** · 

PitLane IQ is an advanced, AI-powered pitwall dashboard that brings real-time Formula 1 strategy, telemetry analysis, and predictive modeling directly to your browser. By ingesting historical and session-level telemetry via FastF1, the platform calculates tire degradation curves, predicts undercut threats, and visualizes stint strategies.

At its core, a conversational AI powered by **IBM Granite** (and Groq) acts as your virtual Chief Strategist, ready to debate pit-stop calls and analyze track conditions on the fly.

---

## ✨ Core Features & Screens

### 🕵️ Shadow Mode (Predictive Analysis)
PitLane IQ doesn't just show you what happened—it shows you what *could* have happened. 
- Run strategies in **Shadow Mode** to compare your hypothetical pit-stop calls against the actual historical decisions made by the teams.
- Real-time impact analysis on track position and projected finish times.

### 📊 The Pitwall Dashboard (Widgets)
The main dashboard is a command center of interactive, data-dense widgets:
- **Tire Degradation Matrix:** Visualizes wear rates across Soft, Medium, and Hard compounds based on live telemetry laps.
- **Stint Analyzer:** A visual timeline of when drivers boxed, what compounds they switched to, and their pace evolution over the stint.
- **Undercut Threat Radar:** Automatically calculates the vulnerability window for drivers being hunted from behind, adjusting for pit-lane loss time and tire delta.
- **Session Selector:** Instantly pull data from any F1 race session between 2018 and the present day.

### 🤖 Live AI Strategist (General Chat & Contextual AI)
- **General F1 Knowledge:** Even before a session loads, chat with the AI about F1 history, rules, and legendary races.
- **Context-Aware Strategy:** Once a session loads, the AI is injected with the live telemetry data. Ask it, *"Should Hamilton box to cover Verstappen?"* and get a mathematically backed response powered by IBM Granite.

---

## 🏗️ Architecture & Tech Stack

PitLane IQ uses a modern, decoupled architecture designed for speed and real-time data handling.

- **Frontend:** React + Vite + TypeScript
- **Styling & UI:** TailwindCSS, Framer Motion (micro-animations), Recharts (telemetry plotting)
- **Backend:** Python + FastAPI 
- **Data Engineering:** FastF1 (telemetry pipeline), Pandas, NumPy, SciPy
- **Database:** **Supabase (PostgreSQL)** — *(Migrated from SQLite for scalable, real-time cloud session tracking)*
- **AI Integration:** IBM Granite (via OpenRouter) & Groq for high-speed inference. Langflow for workflow orchestration. Docling for PDF/Rulebook ingestion.

---

## 🚀 Quick Start Guide

### 1. Database & Cloud Setup
You will need a [Supabase](https://supabase.com) account. Create a new project and get your Postgres URL and Anon Key.

### 2. Backend Setup
```bash
git clone https://github.com/sseth345/pitlane-iq.git
cd pitlane-iq
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment
Create a `.env` file in the root directory and add your keys:
```env
# AI Providers
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
OPENROUTER_API_KEY=sk-or-your_key_here
GRANITE_MODEL=ibm-granite/granite-4.1-8b

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

### 4. Start Backend
```bash
uvicorn backend.main:app --reload --port 8000
```

### 5. Frontend Setup
```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173` in your browser and step onto the pitwall!
