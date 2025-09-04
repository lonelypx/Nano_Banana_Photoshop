#!/bin/bash

# Manual API Key Test Script
# Run this independently to test your Google Gemini API key

echo "🔍 Google Gemini API Key Tester"
echo "================================"

# Check if API key is provided
if [ -z "$1" ]; then
    echo ""
    echo "Usage: ./test_api_key.sh YOUR_API_KEY"
    echo ""
    echo "Example: ./test_api_key.sh AIzaSyD..."
    echo ""
    echo "Get your API key from: https://aistudio.google.com/app/apikey"
    exit 1
fi

API_KEY="$1"
echo "Testing API key: ${API_KEY:0:10}..."

# Test 1: Simple text-only request
echo ""
echo "Test 1: Simple text request..."

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello"}]
    }]
  }' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$API_KEY")

echo "Raw response:"
echo "$RESPONSE" | head -20

# Parse response
if echo "$RESPONSE" | grep -q "candidates"; then
    echo "✅ Text API test successful!"
    
    # Extract the actual response
    if command -v python3 >/dev/null; then
        echo ""
        echo "Extracted response:"
        echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'candidates' in data:
        text = data['candidates'][0]['content']['parts'][0]['text']
        print('Response:', text)
    else:
        print('No candidates in response')
        print('Keys:', list(data.keys()))
except Exception as e:
    print('Parse error:', e)
    print('Raw data:', sys.stdin.read()[:200])
"
    fi
else
    echo "❌ Text API test failed!"
    
    # Check for common error patterns
    if echo "$RESPONSE" | grep -q "API_KEY_INVALID"; then
        echo "🔑 Error: Invalid API key"
        echo "- Check your API key at: https://aistudio.google.com/app/apikey"
        echo "- Make sure you copied it completely"
        echo "- Ensure no extra spaces"
    elif echo "$RESPONSE" | grep -q "PERMISSION_DENIED"; then
        echo "🚫 Error: Permission denied"
        echo "- API might not be enabled"
        echo "- Check quotas and billing"
    elif echo "$RESPONSE" | grep -q "QUOTA_EXCEEDED"; then
        echo "📊 Error: Quota exceeded"
        echo "- You've hit your daily limit"
        echo "- Wait until tomorrow or upgrade"
    else
        echo "🌐 Network or API error"
        echo "Check the raw response above for details"
    fi
fi

echo ""
echo "Test completed."
echo "If successful, your API key works and you can proceed with the Photoshop script."