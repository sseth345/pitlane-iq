import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('.env')

openrouter_key = os.getenv("OPENROUTER_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")

def test_openrouter():
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "ibm-granite/granite-4.1-8b",
        "messages": [{"role": "user", "content": "hello"}],
        "response_format": {"type": "json_object"}
    }
    req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode('utf-8'))
    try:
        with urllib.request.urlopen(req) as response:
            print("OpenRouter OK:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("OpenRouter HTTP Error:", e.code, e.read().decode())

def test_groq():
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant. Output ONLY valid JSON."},
            {"role": "user", "content": "hello"}
        ],
        "response_format": {"type": "json_object"}
    }
    req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode('utf-8'))
    try:
        with urllib.request.urlopen(req) as response:
            print("Groq OK:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("Groq HTTP Error:", e.code, e.read().decode())

test_openrouter()
test_groq()
