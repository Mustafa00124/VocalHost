#!/usr/bin/env python3
"""
Test OpenAI API key with a simple HTTP request
"""
import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

def test_openai_api_key():
    api_key = os.getenv("OPENAI_KEY")
    
    print("🔑 Testing OpenAI API key...")
    print(f"🔑 Using API Key: {api_key[:10] if api_key else 'None'}...")
    print(f"🔑 Full API Key: {repr(api_key)}")
    
    if not api_key or api_key == "sk-your-real-key-here":
        print("❌ No valid API key found!")
        return False
    
    # Test with a simple chat completion request
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Hello, test!"}],
        "max_tokens": 10
    }
    
    try:
        print("📤 Sending test request to OpenAI API...")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API key is valid!")
            print(f"📝 Response: {result['choices'][0]['message']['content']}")
            return True
        else:
            print(f"❌ API key test failed: {response.status_code}")
            print(f"📝 Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    test_openai_api_key()
