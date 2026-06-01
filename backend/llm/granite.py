"""
PitLane IQ — IBM Granite LLM Service
Connects to OpenRouter to access IBM Granite models.
"""

import logging
from openai import OpenAI
from backend.config import settings

logger = logging.getLogger(__name__)

# Initialize OpenRouter Client
try:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )
except Exception as e:
    logger.error(f"Failed to initialize OpenRouter client: {e}")
    client = None


def generate_general_chat(query: str) -> dict:
    """Handle generic F1 questions when no session is loaded."""
    if not query:
        query = "Hello!"
        
    system_prompt = (
        "You are an expert Formula 1 AI assistant.\n"
        "The user has not loaded a specific race session yet, so answer their general F1 questions.\n"
        "Output ONLY valid JSON. Do not use markdown blocks like ```json\n\n"
        "Format requirements:\n"
        "{\n"
        '  "action": "none",\n'
        '  "confidence": 1.0,\n'
        '  "message": "<Your answer>",\n'
        '  "suggested_questions": ["<Question 1>", "<Question 2>", "<Question 3>"]\n'
        "}\n"
    )

    user_prompt = f"The user asks: '{query}'"

    if not client:
        return {
            "action": "none",
            "confidence": 1.0,
            "message": f"[Mocked LLM Response]\n\nI am a general F1 assistant. You asked: {query}",
            "suggested_questions": ["What is an undercut?", "Explain tyre degradation."]
        }

    try:
        response = client.chat.completions.create(
            model=settings.GRANITE_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=300
        )
        content = response.choices[0].message.content
    except Exception as e:
        logger.warning(f"Failed to call OpenRouter IBM Granite: {e}. Falling back to Groq...")
        try:
            from openai import OpenAI
            groq_client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY,
            )
            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=300
            )
            content = response.choices[0].message.content
        except Exception as groq_e:
            return {
                "action": "error",
                "confidence": 0,
                "message": "LLM APIs are currently unavailable (Invalid/Missing API keys). Please configure your API keys.",
                "suggested_questions": []
            }

    import json
    import re
    cleaned_content = re.sub(r'^```json\s*', '', content.strip())
    cleaned_content = re.sub(r'\s*```$', '', cleaned_content)
    try:
        parsed_json = json.loads(cleaned_content)
        if "message" not in parsed_json:
            parsed_json["message"] = str(parsed_json)
        return parsed_json
    except json.JSONDecodeError as e:
        return {
            "action": "error",
            "confidence": 0,
            "message": "Failed to parse AI response: " + cleaned_content
        }


def generate_strategy_debrief(session_data: dict, strategy_data: dict, driver: str, custom_query: str = None) -> dict:
    """
    Generate an explainable AI strategy debrief using IBM Granite.
    """
    if not client:
        return {
            "error": "LLM Client not initialized",
            "message": "Immediate pit stop recommended with 80% confidence (Mocked)",
            "confidence": 0.8,
            "action": "pit_now"
        }

    driver_str = driver.upper()
    
    # Extract relevant strategy context
    if driver_str not in strategy_data.get("drivers", {}):
        return {"error": f"No strategy data found for {driver_str}"}

    driver_strategy = strategy_data["drivers"][driver_str]
    stints = driver_strategy.get("stints", [])
    
    current_stint = stints[-1] if stints else {}
    current_tire = current_stint.get("compound", "UNKNOWN")
    tire_age = current_stint.get("laps_driven", 0)
    
    # Extract current lap info from degradation results to find position and gap
    deg_results = driver_strategy.get("deg_results", [])
    current_lap_info = deg_results[-1] if deg_results else {}
    
    position = current_lap_info.get("position", "Unknown")
    gap_to_leader = current_lap_info.get("gap_to_leader", 0.0)
    
    system_prompt = (
        "You are an expert AI Race Engineer analyzing a Formula 1 race situation using live telemetry.\n"
        "Your task is to provide a clear, concise, and explainable strategy recommendation for the driver.\n"
        "Output ONLY valid JSON. Do not use markdown blocks like ```json\n\n"
        "Format requirements:\n"
        "{\n"
        '  "action": "pit_now" | "stay_out" | "push_hard" | "conserve_tires",\n'
        '  "confidence": <float between 0 and 1>,\n'
        '  "message": "<A detailed analysis with bullet points explaining the strategy>",\n'
        '  "suggested_questions": ["<Question 1>", "<Question 2>", "<Question 3>"],\n'
        '  "key_factors": {\n'
        '    "tyre_degradation": {"impact": <float>, "text": "<short description>"},\n'
        '    "undercut_advantage": {"impact": <float>, "text": "<short description>"},\n'
        '    "dirty_air_loss": {"impact": <float>, "text": "<short description>"},\n'
        '    "pit_stop_delta": {"impact": <float>, "text": "<short description>"}\n'
        '  }\n'
        "}\n"
    )

    user_prompt = f"""
Current Race Situation for Driver {driver_str}:
- Session: {session_data.get('year')} {session_data.get('gp_name')}
- Position: P{position}
- Gap to Leader: +{gap_to_leader:.3f}s
- Current Tire: {current_tire}
- Tire Age: {tire_age} laps

Provide your strategic recommendation based on this telemetry data.
"""

    if custom_query:
        user_prompt += f"\n\nThe Race Engineer asks: '{custom_query}'\nAnswer this question directly in your 'message' field while still providing the best 'action' and 'confidence'."

    try:
        # Attempt to use IBM Granite (OpenRouter)
        response = client.chat.completions.create(
            model=settings.GRANITE_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=250
        )
        content = response.choices[0].message.content
    except Exception as e:
        logger.warning(f"Failed to call OpenRouter IBM Granite: {e}. Falling back to Groq...")
        # Fallback to Groq if OpenRouter key is a placeholder
        try:
            groq_client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY,
            )
            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=250
            )
            content = response.choices[0].message.content
        except Exception as groq_e:
            logger.error(f"Both OpenRouter and Groq failed. Groq error: {groq_e}")
            return {
                "action": "stay_out",
                "confidence": 0.5,
                "message": "LLM APIs are currently unavailable (Invalid/Missing API keys). Please configure your API keys in the Settings tab.\n\nMocked Response: We should extend the stint by 5 laps to wait for a Safety Car.",
                "suggested_questions": ["What if we pit now?", "How are the tyres?"]
            }

    import json
    import re
    # Clean up markdown code blocks if the LLM included them
    cleaned_content = re.sub(r'^```json\s*', '', content.strip())
    cleaned_content = re.sub(r'\s*```$', '', cleaned_content)
    try:
        parsed_json = json.loads(cleaned_content)
        # Handle cases where the LLM hallucinates a function call or skips the 'message' key
        if "message" not in parsed_json:
            parsed_json["message"] = str(parsed_json) # dump raw hallucination so it's not blank
        if "action" not in parsed_json:
            parsed_json["action"] = "stay_out"
        if "confidence" not in parsed_json:
            parsed_json["confidence"] = 0.5
        return parsed_json
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parse Error: {e}. Content: {cleaned_content}")
        return {
            "error": "Failed to parse AI response",
            "action": "error",
            "confidence": 0,
            "message": "AI returned invalid JSON format."
        }
