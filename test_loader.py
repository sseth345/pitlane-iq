from backend.telemetry.loader import load_session

print("Loading session 2023_6_S...")
try:
    res = load_session(2023, 6, "S")
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
