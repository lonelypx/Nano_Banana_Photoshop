# Technical Integration Guide - Google APIs with Photoshop ExtendScript

Deep dive into how the Google API integration works with Adobe Photoshop's ExtendScript environment.

## Architecture Overview

### System Design

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Photoshop     │    │  Platform Helper │    │   Google API    │
│   ExtendScript  │    │     Scripts      │    │    Services     │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • UI Dialogs    │───▶│ • PowerShell     │───▶│ • Gemini API    │
│ • Image Export  │    │ • Bash Scripts   │    │ • Imagen API    │
│ • Layer Import  │    │ • HTTP Requests  │    │ • Vertex AI     │
│ • File I/O      │    │ • JSON Parsing   │    │ • AI Studio     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

```
1. User Input (Photoshop) 
   ↓
2. Image Export (PNG/JPEG)
   ↓
3. Request Preparation (JSON/Text)
   ↓
4. Platform Script Execution (PowerShell/Bash)
   ↓
5. API Communication (HTTP POST)
   ↓
6. Response Processing (JSON → Text/Image)
   ↓
7. Result Import (New Layer/Text)
   ↓
8. Cleanup (Temp Files)
```

## ExtendScript Limitations and Solutions

### Problem 1: No XMLHttpRequest
**ExtendScript Issue**: No modern HTTP request capabilities
```javascript
// ❌ This doesn't work in ExtendScript
var xhr = new XMLHttpRequest();
xhr.open('POST', 'https://api.google.com/...');
```

**Our Solution**: Platform-specific system calls
```javascript
// ✅ This works
if ($.os.indexOf("Windows") > -1) {
    app.system('powershell -File "api_script.ps1"');
} else {
    app.system('/bin/bash "api_script.sh"');
}
```

### Problem 2: No JSON Support
**ExtendScript Issue**: No JSON.parse() or JSON.stringify()
```javascript
// ❌ This doesn't exist
var data = JSON.parse(response);
```

**Our Solution**: Manual parsing and external JSON handling
```javascript
// ✅ Simple key-value format
function parseSimpleJSON(content) {
    var result = {};
    var lines = content.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split(":");
        if (parts.length >= 2) {
            result[parts[0]] = parts[1];
        }
    }
    return result;
}
```

### Problem 3: No Base64 Encoding
**ExtendScript Issue**: No btoa() or native base64 support
```javascript
// ❌ This doesn't exist
var encoded = btoa(imageData);
```

**Our Solution**: System command delegation
```powershell
# Windows PowerShell
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
$imageBase64 = [System.Convert]::ToBase64String($imageBytes)
```

```bash
# macOS/Linux bash
IMAGE_BASE64=$(base64 -i "$imagePath" | tr -d "\n")
```

## API Integration Details

### Google AI Studio Integration

**Endpoint Pattern:**
```
https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}
```

**Supported Models:**
- `gemini-1.5-flash` - Fast, multimodal
- `gemini-1.5-pro` - High quality, detailed analysis
- `gemini-pro-vision` - Specialized for images

**Request Structure:**
```json
{
  "contents": [{
    "parts": [
      {"text": "User prompt here"},
      {
        "inline_data": {
          "mime_type": "image/png",
          "data": "base64_encoded_image_data"
        }
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.4,
    "topK": 32,
    "topP": 1,
    "maxOutputTokens": 2048
  }
}
```

### Google Vertex AI Integration

**Endpoint Pattern:**
```
https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/{MODEL}:predict
```

**Authentication:**
```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Structure for Imagen:**
```json
{
  "instances": [{
    "prompt": "editing prompt",
    "image": {
      "bytesBase64Encoded": "base64_image_data"
    },
    "parameters": {
      "guidance_scale": 7.5,
      "number_of_inference_steps": 20,
      "edit_mode": "inpaint"
    }
  }]
}
```

## Platform-Specific Implementation

### Windows (PowerShell) Implementation

**Advantages:**
- Rich .NET integration
- Built-in HTTP client (Invoke-RestMethod)
- Native base64 encoding
- JSON handling with ConvertTo-Json

**Key Code Patterns:**
```powershell
# HTTP Request
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $jsonBody

# Base64 Encoding
$imageBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($imagePath))

# JSON Creation
$payload = @{
    prompt = $userPrompt
    image = $imageBase64
} | ConvertTo-Json -Depth 10

# File Operations
[IO.File]::WriteAllBytes($outputPath, $decodedBytes)
```

### macOS/Unix (Bash) Implementation

**Advantages:**
- Native curl for HTTP requests
- Standard Unix tools (base64, python3)
- Shell scripting flexibility
- JSON processing with Python

**Key Code Patterns:**
```bash
# HTTP Request with curl
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  "$API_ENDPOINT"

# Base64 Encoding
IMAGE_BASE64=$(base64 -i "$image_path" | tr -d "\n")

# JSON Processing with Python
echo "$response" | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)
result = data['candidates'][0]['content']['parts'][0]['text']
print(result)
"
```

## File Management System

### Temporary File Lifecycle

1. **Creation**
   ```
   /tmp/GeminiPhotoEdit/
   ├── input_1234567890.png      # Exported image
   ├── request_1234567890.txt    # API request data  
   ├── gemini_api.sh            # Generated API script
   └── response_1234567890.txt   # API response
   ```

2. **Processing**
   - Files created with unique timestamps
   - Helper scripts generated per request
   - Automatic cleanup after processing

3. **Security**
   - Files only accessible to current user
   - Automatic removal after processing
   - No sensitive data persisted

### Error Handling Strategy

```javascript
// Multi-level error handling
try {
    var result = processImage();
    if (!result) {
        handleAPIError();
    }
} catch(systemError) {
    handleSystemError(systemError);
} finally {
    cleanupTempFiles();
}
```

## Performance Optimization

### Image Processing Optimization

**Size Optimization:**
```javascript
// Optimal size for API calls
function getOptimalImageSize(doc) {
    var maxDimension = 1024; // Balance quality vs speed
    var width = doc.width;
    var height = doc.height;
    
    if (width > maxDimension || height > maxDimension) {
        var ratio = Math.min(maxDimension / width, maxDimension / height);
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio),
            needsResize: true
        };
    }
    return {width: width, height: height, needsResize: false};
}
```

**Compression Settings:**
```javascript
// Optimal JPEG settings for API upload
var jpegOptions = new JPEGSaveOptions();
jpegOptions.quality = 10;        // High quality for AI processing
jpegOptions.embedColorProfile = false; // Reduce file size
jpegOptions.formatOptions = FormatOptions.STANDARDBASELINE;
```

### API Call Optimization

**Request Batching:**
- Process multiple selections in sequence
- Cache API responses for similar requests
- Implement request queuing for large batches

**Timeout Handling:**
```javascript
// Implement reasonable timeouts
var maxWaitTime = 120; // 2 minutes
var pollInterval = 3;  // Check every 3 seconds
```

## Security Considerations

### API Key Management

**Secure Storage:**
```javascript
// Store in user-specific location
var CONFIG_FILE = Folder.userData + "/GoogleAI_Config.json";

// Never log sensitive data
function logRequest(request) {
    var safeRequest = {};
    for (var key in request) {
        safeRequest[key] = (key === "apiKey") ? "***" : request[key];
    }
    return safeRequest;
}
```

**Runtime Protection:**
```javascript
// Clear sensitive variables
function cleanup() {
    settings.apiKey = "";  // Clear from memory
    // Remove temp files
    cleanupTempFiles();
}
```

### Network Security

**HTTPS Enforcement:**
- All API calls use HTTPS
- Certificate validation in system calls
- No sensitive data in URLs

**Data Protection:**
- Images processed locally before upload
- Automatic cleanup of temp files
- No persistent storage of user images

## Debugging and Development

### Debug Mode Setup

Add debug flag to settings:
```javascript
var DEBUG = true; // Set to false for production

function debugLog(message) {
    if (DEBUG) {
        var logFile = new File(TEMP_FOLDER + "debug.log");
        logFile.open("a");
        logFile.writeln(new Date().toISOString() + ": " + message);
        logFile.close();
    }
}
```

### Testing API Connections

**Test Script for API Validation:**
```javascript
function testAPIConnection() {
    try {
        // Create minimal test request
        var testPrompt = "Test connection";
        var testImage = createTestImage(); // 1x1 pixel image
        
        var success = makeAPICall(testPrompt, testImage);
        return success;
    } catch(e) {
        debugLog("API test failed: " + e.message);
        return false;
    }
}
```

### Performance Monitoring

**Add timing to operations:**
```javascript
function timeOperation(name, operation) {
    var startTime = Date.now();
    var result = operation();
    var endTime = Date.now();
    debugLog(name + " took " + (endTime - startTime) + "ms");
    return result;
}
```

## Extension and Customization

### Adding New API Providers

To add support for other Google AI services:

1. **Define New Model:**
   ```javascript
   GOOGLE_APIS["new-model"] = {
       name: "New Google AI Model",
       endpoint: "https://api-endpoint.googleapis.com/...",
       features: ["feature1", "feature2"],
       description: "Model description"
   };
   ```

2. **Update Helper Scripts:**
   - Add new request format in PowerShell/Bash scripts
   - Handle new response format
   - Add model-specific parameters

3. **Update UI:**
   - Add radio button for new model
   - Add model-specific options
   - Update help text

### Custom Parameter Support

**Adding Advanced Parameters:**
```javascript
var advancedSettings = {
    negativePrompt: "",
    aspectRatio: "square",
    stylePreset: "photographic",
    qualityBoost: false
};
```

### Workflow Integration

**Integration with Photoshop Actions:**
```javascript
// Make script action-friendly
function scriptMain(prompt, options) {
    // Can be called from actions
    return processImage(prompt, options);
}
```

**Batch Processing Support:**
```javascript
function processBatch(imageList, prompts) {
    for (var i = 0; i < imageList.length; i++) {
        processImage(prompts[i], defaultOptions);
    }
}
```

## Future Enhancements

### Planned Improvements

1. **Real-time Preview**: Show API results before applying
2. **History Management**: Undo/redo for AI edits  
3. **Batch Processing**: Process multiple images at once
4. **Template System**: Save and reuse prompt templates
5. **Cloud Sync**: Sync settings across devices

### Migration Path to UXP

For future Photoshop versions:
```javascript
// UXP migration considerations
// - Modern JavaScript support
// - Native fetch API
// - Better file handling
// - Improved security model
```

---

## API Rate Limits and Costs

### Google AI Studio (Free Tier)
- **Gemini Flash**: 1,500 requests/day
- **Gemini Pro**: 50 requests/day
- **Rate Limit**: 2 requests/minute

### Google Cloud Vertex AI (Paid)
- **Imagen**: $0.020-$0.120 per image
- **Gemini**: $0.00025-$0.0075 per request
- **Rate Limit**: 600 requests/minute

### Usage Monitoring
```javascript
// Track API usage
var usageStats = {
    dailyRequests: 0,
    totalCost: 0,
    lastReset: new Date().toDateString()
};
```

This technical documentation provides everything needed to understand, modify, and extend the Google API integration for Photoshop!