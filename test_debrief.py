from backend.intelligence.debrief import get_ai_debrief

print("Testing get_ai_debrief...")
# The session key from the UI seems to be something like "2024_12_R" for British GP (Silverstone).
# Let's try to pass the actual session key. We can read it from the database.
from backend import database
sessions = database.list_sessions()
print("Sessions:", sessions)

if sessions:
    session_key = sessions[0].session_key
    print("Testing session key:", session_key)
    res = get_ai_debrief(session_key, "HAM", "test query")
    print("Result:", res)
else:
    print("No sessions found in DB.")
