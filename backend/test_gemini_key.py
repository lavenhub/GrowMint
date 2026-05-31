"""Quick check: python test_gemini_key.py"""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

key = (os.getenv("GEMINI_API_KEY") or "").strip()
if not key or key == "your_key_here":
    print("FAIL: GEMINI_API_KEY is missing in backend/.env")
    sys.exit(1)

if " " in key or key.startswith('"') or key.startswith("'"):
    print("FAIL: Key has extra spaces or quotes — use: GEMINI_API_KEY=AIzaSy...")
    sys.exit(1)

try:
    import google.generativeai as genai

    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content('Reply with exactly: OK')
    text = (response.text or "").strip()
    print("SUCCESS: Gemini accepted your API key.")
    print("Sample response:", text[:80])
except Exception as e:
    print("FAIL:", str(e))
    sys.exit(1)
