# Supabase Migration Plan
**PitLane IQ — PostgreSQL Database Architecture**

## 1. Overview & Benefits
We are migrating PitLane IQ's Data Layer from local SQLite to Supabase (PostgreSQL).
This unlocks:
- **Scalability**: Handles thousands of concurrent session loads without locking.
- **JSONB Native**: Extremely fast querying and storage of nested strategy JSONs compared to SQLite string blobs.
- **Serverless Ready**: Detaches the database from the local file system, allowing the Python backend to be hosted anywhere.
- **pgvector Integration**: Future-proofing for LLM RAG capabilities (storing embeddings of historic race strategies).
- **Realtime**: We can replace custom WebSocket handling with Supabase's native real-time publish/subscribe functionality.

---

## 2. Table Definitions (PostgreSQL Schema)

Run this SQL directly in the Supabase SQL Editor to initialize the database:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sessions Table
CREATE TABLE sessions (
    session_key VARCHAR(20) PRIMARY KEY,
    year INT NOT NULL,
    round INT NOT NULL,
    gp_name VARCHAR(100) NOT NULL,
    session_type VARCHAR(10) NOT NULL,
    total_laps INT,
    drivers JSONB,
    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lap Records Table
CREATE TABLE lap_records (
    id SERIAL PRIMARY KEY,
    session_key VARCHAR(20) REFERENCES sessions(session_key) ON DELETE CASCADE,
    driver VARCHAR(5) NOT NULL,
    lap_number INT NOT NULL,
    lap_time FLOAT,
    sector1 FLOAT,
    sector2 FLOAT,
    sector3 FLOAT,
    compound VARCHAR(20),
    tyre_life INT,
    stint INT,
    position INT,
    is_pit_in BOOLEAN DEFAULT FALSE,
    is_pit_out BOOLEAN DEFAULT FALSE,
    speed_trap FLOAT,
    is_valid BOOLEAN DEFAULT TRUE,
    UNIQUE(session_key, driver, lap_number)
);
CREATE INDEX idx_laps_session ON lap_records(session_key);

-- 3. Strategy Cache Table
CREATE TABLE strategy_cache (
    session_key VARCHAR(20) PRIMARY KEY REFERENCES sessions(session_key) ON DELETE CASCADE,
    strategy_json JSONB NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Shadow Events Table (Realtime enabled)
CREATE TABLE shadow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_key VARCHAR(20) REFERENCES sessions(session_key) ON DELETE CASCADE,
    lap INT NOT NULL,
    driver VARCHAR(5),
    message TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    category VARCHAR(20) NOT NULL,
    surfaced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_shadow_events_session ON shadow_events(session_key);

-- Turn on Realtime for shadow_events
ALTER PUBLICATION supabase_realtime ADD TABLE shadow_events;
```

---

## 3. Query Replacements

We will swap `aiosqlite` raw queries with the elegant Supabase Python SDK.

### **Checking Cache**
**Before (SQLite):**
```python
cursor.execute("SELECT * FROM sessions WHERE session_key = ?", (key,))
```
**After (Supabase):**
```python
res = supabase.table("sessions").select("*").eq("session_key", key).maybe_single().execute()
```

### **Bulk Inserting FastF1 Laps**
**Before (SQLite):**
```python
cursor.executemany("INSERT INTO lap_records (...) VALUES (...)", rows)
```
**After (Supabase):**
```python
# Pass list of dictionaries for bulk insert
supabase.table("lap_records").upsert(lap_dictionaries).execute()
```

### **Writing Strategy JSON**
**Before (SQLite):**
```python
cursor.execute("INSERT INTO strategy_cache (session_key, strategy_json) VALUES (?, ?)", (key, json.dumps(strategy)))
```
**After (Supabase):**
```python
# Native JSONB support
supabase.table("strategy_cache").upsert({
    "session_key": key, 
    "strategy_json": strategy_dict
}).execute()
```

---

## 4. Implementation Steps

1. **Install SDK**: Run `pip install supabase`.
2. **Environment**: Add `SUPABASE_URL` and `SUPABASE_KEY` to `.env`.
3. **Database Engine Rewrite**: Rip out `aiosqlite` from `backend/database.py` and replace it with a globally initialized Supabase client:
   ```python
   import os
   from supabase import create_client, Client

   url: str = os.environ.get("SUPABASE_URL")
   key: str = os.environ.get("SUPABASE_KEY")
   supabase: Client = create_client(url, key)
   ```
4. **Refactor Endpoint Calls**: Update `main.py`, `loader.py`, and `strategy_service.py` to invoke the `database.py` Supabase wrapper methods.
5. **Realtime Feed (Phase 2)**: Transition the frontend to subscribe directly to `shadow_events` insertions via the Supabase Javascript client.
