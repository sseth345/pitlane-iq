from backend.api.strategy_service import StrategyService

svc = StrategyService()
try:
    print("Computing strategy...")
    res = svc.compute_session_strategy("2023_1_R")
    print("Success. Drivers in strategy:", list(res.drivers.keys()) if res else None)
except Exception as e:
    import traceback
    traceback.print_exc()
