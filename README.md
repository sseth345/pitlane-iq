# PitLane IQ

Race Intelligence Platform · IBM AI Builders Challenge

## Quick Start

### 1. Backend Setup

```bash
cd pitlane-iq
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

```bash
copy .env.example .env
# Edit .env with your API keys
```

Get a free Groq API key: https://console.groq.com

### 3. Start Backend

```bash
uvicorn backend.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173

## Architecture

- **Backend**: FastAPI + FastF1 + SQLite
- **Frontend**: Vite + React + TypeScript + Tailwind + Recharts
- **AI**: Groq (primary) / IBM Granite via OpenRouter (fallback)
- **IBM Tools**: Langflow (conversational AI), Docling (PDF ingestion)

## Data Sources

- FastF1: Historical F1 session data (2018–present)
- All strategy intelligence computed from real telemetry data
