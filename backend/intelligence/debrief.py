"""
PitLane IQ — Intelligence Orchestrator
Gathers telemetry and strategy data to pass to IBM Granite.
"""

from backend.llm.granite import generate_strategy_debrief
from backend import database
from backend.api.strategy_service import StrategyService

strategy_service = StrategyService()

def get_ai_debrief(session_key: str, driver: str, query: str = None) -> dict:
    """
    Fetch session data and computed strategy, then generate an AI debrief.
    """
    if session_key == "general":
        from backend.llm.granite import generate_general_chat
        return generate_general_chat(query)

    session = database.get_session(session_key)
    if not session:
        return {"error": "Session not found"}

    strategy_data = strategy_service.compute_session_strategy(session_key)
    if not strategy_data:
        return {"error": "Could not compute strategy data"}
    
    # Convert strategy Pydantic model to dict if necessary
    strategy_dict = strategy_data.dict() if hasattr(strategy_data, "dict") else strategy_data

    return generate_strategy_debrief(session, strategy_dict, driver, query)
