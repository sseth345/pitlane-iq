import json
from backend.api.strategy_service import StrategyService

svc = StrategyService()
res = svc.compute_session_strategy("2023_1_R")
print("First driver strategy keys:", res.drivers["HAM"].dict().keys())
print("HAM:", json.dumps(res.drivers["HAM"].dict(), indent=2))
