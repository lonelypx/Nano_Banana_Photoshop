// Fixed Google Gemini Script with Debugging
// This version includes comprehensive error handling and logging

#target photoshop

// Settings with better defaults
var settings = {
    apiKey: "",
    model: "gemini-1.5-flash",
    lastPrompt: "",
    createNewLayer: true,
    debug: true
};

var CONFIG_FILE = Folder.userData + "/GeminiFixed_Config.txt";
var TEMP_BASE = Folder.temp.fsName;
var TEMP_FOLDER = TEMP_BASE + "/GeminiPhotoEdit/";
var LOG_FILE = TEMP_BASE + "/gemini_debug.log";

// Logging function
function log(message) {
    try {
        var timestamp = new Date().toISOString();
        var logFile = new File(LOG_FILE);
        logFile.open("a");
        logFile.writeln(timestamp + ": " + message);
        logFile.close();
        
        if (settings.debug) {
            $.writeln("DEBUG: " + message);
        }
    } catch(e) {}
}

// Safe folder creation
function createTempFolder() {
    try {
        var folder = new Folder(TEMP_FOLDER);
        if (!folder.exists) {
            var success = folder.create();
            log("Temp folder created: " + success + " at " + TEMP_FOLDER);
            return success;
        }
        log("Temp folder exists: " + TEMP_FOLDER);
        return true;
    } catch(e) {
        log("Failed to create temp folder: " + e.message);
        alert("Cannot create temp folder: " + e.message + "\n\nTrying alternative location...");
        
        // Try alternative location
        TEMP_FOLDER = Folder.desktop.fsName + "/GeminiTemp/";
        try {
            var altFolder = new Folder(TEMP_FOLDER);
            var success = altFolder.create();
            log("Alternative temp folder created: " + success);
            return success;
        } catch(e2) {
            log("Alternative folder failed: " + e2.message);
            return false;
        }
    }
}

// Main function with comprehensive error handling
function main() {
    try {
        log("=== Script started ===");
        log("Photoshop version: " + app.version);
        log("Platform: " + $.os);
        log("ExtendScript version: " + $.version);
        
        // Check basic requirements
        if (app.documents.length == 0) {
            log("No documents open");
            alert("Please open a document first.");
            return;
        }
        log("Active document: " + app.activeDocument.name);
        
        // Create temp folder
        if (!createTempFolder()) {
            alert("Cannot create temporary folder. Check permissions.");
            return;
        }
        
        // Load settings
        loadConfig();
        log("Settings loaded. API Key length: " + (settings.apiKey ? settings.apiKey.length : 0));
        
        // Check API key
        if (!settings.apiKey || settings.apiKey.length < 10) {
            log("No valid API key found");
            showApiKeyDialog();
            return;
        }
        
        // Show main dialog
        showMainDialog();
        
    } catch(e) {
        log("Main function error: " + e.message);
        alert("Startup Error: " + e.message + "\n\nCheck debug log at:\n" + LOG_FILE);
    }
}

// Simple API key dialog
function showApiKeyDialog() {
    var dialog = new Window("dialog", "Google API Setup");
    dialog.orientation = "column";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    dialog.add("statictext", undefined, "🤖 Google Gemini for Photoshop");
    
    var instructText = dialog.add("statictext", undefined, "Get your FREE API key from:", {multiline: true});
    dialog.add("statictext", undefined, "https://aistudio.google.com/app/apikey");
    
    var keyGroup = dialog.add("group");
    keyGroup.add("statictext", undefined, "API Key:");
    var keyInput = keyGroup.add("edittext", undefined, settings.apiKey);
    keyInput.characters = 40;
    keyInput.active = true;
    
    var testBtn = dialog.add("button", undefined, "Test Connection");
    var saveBtn = dialog.add("button", undefined, "Save & Continue");
    
    testBtn.onClick = function() {
        if (!keyInput.text) {
            alert("Please enter your API key first.");
            return;
        }
        
        alert("Testing API connection...\n\nThis will create a test file and attempt to connect to Google's API.");
        
        // Simple connection test
        var testSuccess = testAPIConnection(keyInput.text);
        alert(testSuccess ? "✅ Connection successful!" : "❌ Connection failed. Check key and internet connection.");
    };
    
    saveBtn.onClick = function() {
        if (!keyInput.text) {
            alert("Please enter your API key.");
            return;
        }
        
        settings.apiKey = keyInput.text;
        saveConfig();
        log("API key saved, length: " + settings.apiKey.length);
        dialog.close();
        showMainDialog();
    };
    
    dialog.show();
}

// Test API connection
function testAPIConnection(apiKey) {
    try {
        log("Testing API connection with key: " + apiKey.substring(0, 10) + "...");
        
        // Create simple test request
        var testFile = new File(TEMP_FOLDER + "test_request.txt");
        testFile.open("w");
        testFile.writeln("apiKey:" + apiKey);
        testFile.writeln("model:gemini-1.5-flash");
        testFile.writeln("prompt:respond with just the word 'success'");
        testFile.close();
        
        var responseFile = TEMP_FOLDER + "test_response.txt";
        var scriptPath = createTestScript(testFile.fsName, responseFile);
        
        log("Executing test script: " + scriptPath);
        
        if ($.os.indexOf("Windows") > -1) {
            app.system('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        } else {
            app.system('chmod +x "' + scriptPath + '"');
            app.system('"' + scriptPath + '"');
        }
        
        // Check result
        var success = false;
        var response = new File(responseFile);
        if (response.exists && response.length > 0) {
            response.open("r");
            var content = response.read();
            response.close();
            success = (content.toLowerCase().indexOf("success") >= 0);
            log("Test response: " + content.substring(0, 100));
        } else {
            log("No test response file found");
        }
        
        // Cleanup
        testFile.remove();
        if (response.exists) response.remove();
        (new File(scriptPath)).remove();
        
        return success;
        
    } catch(e) {
        log("Test connection error: " + e.message);
        return false;
    }
}

// Create test script
function createTestScript(requestPath, responsePath) {
    var scriptPath;
    
    if ($.os.indexOf("Windows") > -1) {
        scriptPath = TEMP_FOLDER + "test_api.ps1";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('# Simple API test');
        script.writeln('$request = @{}');
        script.writeln('Get-Content "' + requestPath + '" | ForEach-Object {');
        script.writeln('    $parts = $_ -split ":", 2');
        script.writeln('    if ($parts.Length -eq 2) { $request[$parts[0]] = $parts[1] }');
        script.writeln('}');
        script.writeln('');
        script.writeln('$body = @{');
        script.writeln('    contents = @(@{');
        script.writeln('        parts = @(@{ text = $request.prompt })');
        script.writeln('    })');
        script.writeln('} | ConvertTo-Json -Depth 5');
        script.writeln('');
        script.writeln('$url = "https://generativelanguage.googleapis.com/v1beta/models/" + $request.model + ":generateContent?key=" + $request.apiKey');
        script.writeln('');
        script.writeln('try {');
        script.writeln('    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"');
        script.writeln('    if ($response.candidates -and $response.candidates[0].content.parts[0].text) {');
        script.writeln('        $response.candidates[0].content.parts[0].text | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('    } else {');
        script.writeln('        "No valid response structure" | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('    }');
        script.writeln('} catch {');
        script.writeln('    ("API Error: " + $_.Exception.Message) | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('}');
        
        script.close();
        
    } else {
        scriptPath = TEMP_FOLDER + "test_api.sh";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('#!/bin/bash');
        script.writeln('');
        script.writeln('# Read request');
        script.writeln('declare -A request');
        script.writeln('while IFS=: read -r key value; do');
        script.writeln('    request["$key"]="$value"');
        script.writeln('done < "' + requestPath + '"');
        script.writeln('');
        script.writeln('# Simple text-only test (no image)');
        script.writeln('JSON_PAYLOAD=$(cat <<EOF');
        script.writeln('{');
        script.writeln('  "contents": [{');
        script.writeln('    "parts": [{"text": "${request[prompt]}"}]');
        script.writeln('  }]');
        script.writeln('}');
        script.writeln('EOF');
        script.writeln(')');
        script.writeln('');
        script.writeln('# API call');
        script.writeln('RESPONSE=$(curl -s -X POST \\');
        script.writeln('  -H "Content-Type: application/json" \\');
        script.writeln('  -d "$JSON_PAYLOAD" \\');
        script.writeln('  "https://generativelanguage.googleapis.com/v1beta/models/${request[model]}:generateContent?key=${request[apiKey]}")');
        script.writeln('');
        script.writeln('# Extract response');
        script.writeln('if command -v python3 >/dev/null 2>&1; then');
        script.writeln('    echo "$RESPONSE" | python3 -c "');
        script.writeln('import sys, json');
        script.writeln('try:');
        script.writeln('    data = json.load(sys.stdin)');
        script.writeln('    text = data[\"candidates\"][0][\"content\"][\"parts\"][0][\"text\"]');
        script.writeln('    print(text)');
        script.writeln('except Exception as e:');
        script.writeln('    print(f\"Parse error: {e}\")');
        script.writeln('    print(f\"Raw response: {sys.stdin.read()[:200]}\")');
        script.writeln('" > "' + responsePath + '"');
        script.writeln('else');
        script.writeln('    echo "Python3 not found. Raw response:" > "' + responsePath + '"');
        script.writeln('    echo "$RESPONSE" >> "' + responsePath + '"');
        script.writeln('fi');
        
        script.close();
    }
    
    return scriptPath;
}

// Main dialog with better error handling
function showMainDialog() {
    var dialog = new Window("dialog", "Gemini Image Editor [DEBUG MODE]");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    dialog.add("statictext", undefined, "🔍 Debug Mode - Check log at: " + LOG_FILE);
    
    var hasSelection = checkSelection();
    dialog.add("statictext", undefined, hasSelection ? "✓ Selection detected" : "ℹ Will analyze entire image");
    
    var promptPanel = dialog.add("panel", undefined, "What do you want to analyze?");
    promptPanel.alignChildren = "fill";
    var promptInput = promptPanel.add("edittext", undefined, settings.lastPrompt, {multiline: true});
    promptInput.preferredSize.height = 80;
    promptInput.active = true;
    
    var newLayerCheck = dialog.add("checkbox", undefined, "Add response as text layer");
    newLayerCheck.value = settings.createNewLayer;
    
    var buttonGroup = dialog.add("group");
    var analyzeBtn = buttonGroup.add("button", undefined, "🔍 Analyze");
    var debugBtn = buttonGroup.add("button", undefined, "🐛 Debug");
    var logBtn = buttonGroup.add("button", undefined, "📋 Show Log");
    var cancelBtn = buttonGroup.add("button", undefined, "Cancel");
    
    analyzeBtn.onClick = function() {
        if (!promptInput.text) {
            alert("Please enter what you want to analyze.");
            return;
        }
        
        settings.lastPrompt = promptInput.text;
        settings.createNewLayer = newLayerCheck.value;
        saveConfig();
        
        dialog.close();
        processWithDebugging(promptInput.text);
    };
    
    debugBtn.onClick = function() {
        runDiagnostics();
    };
    
    logBtn.onClick = function() {
        showLogFile();
    };
    
    dialog.show();
}

// Process with comprehensive debugging
function processWithDebugging(prompt) {
    try {
        log("=== Starting image processing ===");
        log("Prompt: " + prompt);
        
        // Step 1: Export image
        log("Step 1: Exporting image");
        var imagePath = exportCurrentImage();
        if (!imagePath) {
            log("ERROR: Failed to export image");
            alert("Failed to export image. Check permissions and disk space.");
            return;
        }
        log("Image exported to: " + imagePath);
        
        // Step 2: Create request
        log("Step 2: Creating API request");
        var requestPath = TEMP_FOLDER + "request_" + Date.now() + ".txt";
        var requestFile = new File(requestPath);
        requestFile.open("w");
        requestFile.writeln("apiKey:" + settings.apiKey);
        requestFile.writeln("model:" + settings.model);
        requestFile.writeln("imagePath:" + imagePath);
        requestFile.writeln("prompt:" + prompt);
        requestFile.close();
        log("Request file created: " + requestPath);
        
        // Step 3: Execute API call
        log("Step 3: Executing API call");
        var responsePath = TEMP_FOLDER + "response_" + Date.now() + ".txt";
        var scriptPath = createAPIScript(requestPath, responsePath);
        log("API script created: " + scriptPath);
        
        var command;
        if ($.os.indexOf("Windows") > -1) {
            command = 'powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"';
        } else {
            app.system('chmod +x "' + scriptPath + '"');
            command = '"' + scriptPath + '"';
        }
        
        log("Executing command: " + command);
        app.system(command);
        log("Command executed");
        
        // Step 4: Check response
        log("Step 4: Reading response");
        var responseFile = new File(responsePath);
        
        // Wait a bit for response
        var maxWait = 30; // 30 seconds
        var waited = 0;
        while (!responseFile.exists && waited < maxWait) {
            $.sleep(1000);
            waited++;
            log("Waiting for response... " + waited + "s");
        }
        
        if (responseFile.exists) {
            responseFile.open("r");
            var response = responseFile.read();
            responseFile.close();
            log("Response received, length: " + response.length);
            log("Response preview: " + response.substring(0, 200));
            
            if (response && response.length > 10) {
                showResponse(response, prompt);
            } else {
                alert("Empty response received. Check log for details.");
            }
        } else {
            log("ERROR: No response file created");
            
            // Check for error files
            var errorFile = new File(responsePath + ".error");
            if (errorFile.exists) {
                errorFile.open("r");
                var errorMsg = errorFile.read();
                errorFile.close();
                log("Error file content: " + errorMsg);
                alert("API Error:\n" + errorMsg);
            } else {
                alert("No response received. Check:\n" +
                      "1. Internet connection\n" +
                      "2. API key validity\n" +
                      "3. Debug log: " + LOG_FILE);
            }
        }
        
        // Cleanup
        (new File(imagePath)).remove();
        requestFile.remove();
        if (responseFile.exists) responseFile.remove();
        (new File(scriptPath)).remove();
        
    } catch(e) {
        log("Processing error: " + e.message);
        alert("Processing Error: " + e.message + "\n\nSee log: " + LOG_FILE);
    }
}

// Create API script with better error handling
function createAPIScript(requestPath, responsePath) {
    var scriptPath;
    
    if ($.os.indexOf("Windows") > -1) {
        scriptPath = TEMP_FOLDER + "api_call.ps1";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('# Enhanced API script with error handling');
        script.writeln('$ErrorActionPreference = "Continue"');
        script.writeln('');
        script.writeln('# Read request');
        script.writeln('$request = @{}');
        script.writeln('Get-Content "' + requestPath + '" | ForEach-Object {');
        script.writeln('    $parts = $_ -split ":", 2');
        script.writeln('    if ($parts.Length -eq 2) { $request[$parts[0]] = $parts[1] }');
        script.writeln('}');
        script.writeln('');
        script.writeln('try {');
        script.writeln('    # Test if image file exists');
        script.writeln('    if (-not (Test-Path $request.imagePath)) {');
        script.writeln('        throw "Image file not found: " + $request.imagePath');
        script.writeln('    }');
        script.writeln('    ');
        script.writeln('    # Read and encode image');
        script.writeln('    $imageBytes = [System.IO.File]::ReadAllBytes($request.imagePath)');
        script.writeln('    $imageBase64 = [System.Convert]::ToBase64String($imageBytes)');
        script.writeln('    $imageDataUri = "data:image/png;base64," + $imageBase64');
        script.writeln('    ');
        script.writeln('    # Create request body');
        script.writeln('    $body = @{');
        script.writeln('        contents = @(@{');
        script.writeln('            parts = @(');
        script.writeln('                @{ text = $request.prompt },');
        script.writeln('                @{ inline_data = @{ mime_type = "image/png"; data = $imageBase64 } }');
        script.writeln('            )');
        script.writeln('        })');
        script.writeln('    } | ConvertTo-Json -Depth 10');
        script.writeln('    ');
        script.writeln('    # API call');
        script.writeln('    $url = "https://generativelanguage.googleapis.com/v1beta/models/" + $request.model + ":generateContent?key=" + $request.apiKey');
        script.writeln('    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60');
        script.writeln('    ');
        script.writeln('    # Extract response');
        script.writeln('    if ($response.candidates -and $response.candidates[0].content.parts[0].text) {');
        script.writeln('        $response.candidates[0].content.parts[0].text | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('    } else {');
        script.writeln('        "No valid response from API" | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('    }');
        script.writeln('    ');
        script.writeln('} catch {');
        script.writeln('    ("PowerShell Error: " + $_.Exception.Message + "`nAPI URL: " + $url) | Out-File "' + responsePath + '.error" -Encoding UTF8');
        script.writeln('}');
        
        script.close();
        
    } else {
        scriptPath = TEMP_FOLDER + "api_call.sh";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('#!/bin/bash');
        script.writeln('set -e');  // Exit on error
        script.writeln('');
        script.writeln('# Read request');
        script.writeln('declare -A request');
        script.writeln('while IFS=: read -r key value; do');
        script.writeln('    request["$key"]="$value"');
        script.writeln('done < "' + requestPath + '"');
        script.writeln('');
        script.writeln('# Validate inputs');
        script.writeln('if [ ! -f "${request[imagePath]}" ]; then');
        script.writeln('    echo "Image file not found: ${request[imagePath]}" > "' + responsePath + '.error"');
        script.writeln('    exit 1');
        script.writeln('fi');
        script.writeln('');
        script.writeln('# Encode image');
        script.writeln('IMAGE_BASE64=$(base64 -i "${request[imagePath]}" | tr -d "\\n")');
        script.writeln('if [ -z "$IMAGE_BASE64" ]; then');
        script.writeln('    echo "Failed to encode image" > "' + responsePath + '.error"');
        script.writeln('    exit 1');
        script.writeln('fi');
        script.writeln('');
        script.writeln('# Create payload');
        script.writeln('PAYLOAD=$(cat <<EOF');
        script.writeln('{');
        script.writeln('  "contents": [{');
        script.writeln('    "parts": [');
        script.writeln('      {"text": "${request[prompt]}"},');
        script.writeln('      {"inline_data": {"mime_type": "image/png", "data": "$IMAGE_BASE64"}}');
        script.writeln('    ]');
        script.writeln('  }]');
        script.writeln('}');
        script.writeln('EOF');
        script.writeln(')');
        script.writeln('');
        script.writeln('# API call with error handling');
        script.writeln('RESPONSE=$(curl -s -X POST \\');
        script.writeln('  -H "Content-Type: application/json" \\');
        script.writeln('  -d "$PAYLOAD" \\');
        script.writeln('  "https://generativelanguage.googleapis.com/v1beta/models/${request[model]}:generateContent?key=${request[apiKey]}" \\');
        script.writeln('  --max-time 60)');
        script.writeln('');
        script.writeln('if [ $? -ne 0 ]; then');
        script.writeln('    echo "curl failed" > "' + responsePath + '.error"');
        script.writeln('    exit 1');
        script.writeln('fi');
        script.writeln('');
        script.writeln('# Parse response');
        script.writeln('if command -v python3 >/dev/null 2>&1; then');
        script.writeln('    echo "$RESPONSE" | python3 -c "');
        script.writeln('import sys, json');
        script.writeln('try:');
        script.writeln('    data = json.load(sys.stdin)');
        script.writeln('    if \"candidates\" in data and len(data[\"candidates\"]) > 0:');
        script.writeln('        text = data[\"candidates\"][0][\"content\"][\"parts\"][0][\"text\"]');
        script.writeln('        print(text)');
        script.writeln('    else:');
        script.writeln('        print(\"No candidates in response\")');
        script.writeln('        print(\"Raw response:\", str(data)[:500])');
        script.writeln('except Exception as e:');
        script.writeln('    print(f\"JSON parse error: {e}\")');
        script.writeln('    print(\"Raw response:\", sys.stdin.read()[:500])');
        script.writeln('" > "' + responsePath + '"');
        script.writeln('else');
        script.writeln('    echo "Python3 required but not found" > "' + responsePath + '.error"');
        script.writeln('    echo "$RESPONSE" >> "' + responsePath + '.error"');
        script.writeln('fi');
        
        script.close();
    }
    
    return scriptPath;
}

// Diagnostics function
function runDiagnostics() {
    var results = [];
    
    log("=== Running diagnostics ===");
    
    // Check 1: Photoshop version
    results.push("Photoshop: " + app.version + " ✅");
    
    // Check 2: Platform
    results.push("Platform: " + $.os + " ✅");
    
    // Check 3: Temp folder
    var folderExists = (new Folder(TEMP_FOLDER)).exists;
    results.push("Temp folder: " + (folderExists ? "✅" : "❌"));
    
    // Check 4: API key
    var keyValid = (settings.apiKey && settings.apiKey.length > 10);
    results.push("API key: " + (keyValid ? "✅ (" + settings.apiKey.length + " chars)" : "❌"));
    
    // Check 5: Document
    var hasDoc = (app.documents.length > 0);
    results.push("Active document: " + (hasDoc ? "✅" : "❌"));
    
    // Check 6: Internet (basic test)
    results.push("Network: Testing...");
    
    alert("🔍 System Diagnostics:\n\n" + results.join("\n") + "\n\nDetailed log at:\n" + LOG_FILE);
}

// Show log file
function showLogFile() {
    try {
        var logFile = new File(LOG_FILE);
        if (logFile.exists) {
            logFile.open("r");
            var content = logFile.read();
            logFile.close();
            
            // Show last 2000 characters
            var preview = content.length > 2000 ? "..." + content.substring(content.length - 2000) : content;
            
            var logDialog = new Window("dialog", "Debug Log");
            logDialog.orientation = "column";
            logDialog.preferredSize.width = 600;
            
            var logText = logDialog.add("edittext", undefined, preview, {multiline: true, readonly: true});
            logText.preferredSize.height = 400;
            
            var btnGroup = logDialog.add("group");
            var clearBtn = btnGroup.add("button", undefined, "Clear Log");
            var closeBtn = btnGroup.add("button", undefined, "Close");
            
            clearBtn.onClick = function() {
                logFile.remove();
                alert("Log cleared.");
                logDialog.close();
            };
            
            logDialog.show();
        } else {
            alert("No log file found at:\n" + LOG_FILE);
        }
    } catch(e) {
        alert("Cannot read log: " + e.message);
    }
}

// Other helper functions
function checkSelection() {
    try {
        var bounds = app.activeDocument.selection.bounds;
        var hasSelection = (bounds[0] != bounds[2] && bounds[1] != bounds[3]);
        log("Selection check: " + hasSelection);
        return hasSelection;
    } catch(e) {
        log("Selection check error: " + e.message);
        return false;
    }
}

function exportCurrentImage() {
    try {
        var doc = app.activeDocument;
        var file = new File(TEMP_FOLDER + "input_" + Date.now() + ".png");
        log("Exporting to: " + file.fsName);
        
        var exportDoc;
        if (checkSelection()) {
            log("Exporting selection");
            doc.selection.copy();
            var bounds = doc.selection.bounds;
            var width = bounds[2] - bounds[0];
            var height = bounds[3] - bounds[1];
            exportDoc = app.documents.add(width, height, doc.resolution, "TempExport", NewDocumentMode.RGB);
            exportDoc.paste();
        } else {
            log("Exporting entire document");
            exportDoc = doc;
        }
        
        var pngOptions = new PNGSaveOptions();
        exportDoc.saveAs(file, pngOptions, true);
        
        if (exportDoc != doc) {
            exportDoc.close(SaveOptions.DONOTSAVECHANGES);
        }
        
        log("Export complete, file size: " + file.length + " bytes");
        return file.fsName;
        
    } catch(e) {
        log("Export error: " + e.message);
        return null;
    }
}

function showResponse(response, prompt) {
    log("Displaying response");
    
    if (settings.createNewLayer) {
        addResponseToDocument(response, prompt);
    }
    
    var dialog = new Window("dialog", "Gemini Analysis");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 600;
    
    dialog.add("statictext", undefined, "Prompt: " + prompt);
    
    var responseText = dialog.add("edittext", undefined, response, {multiline: true, readonly: true});
    responseText.preferredSize.height = 350;
    
    var btnGroup = dialog.add("group");
    var newBtn = btnGroup.add("button", undefined, "New Analysis");
    var closeBtn = btnGroup.add("button", undefined, "Close");
    
    newBtn.onClick = function() {
        dialog.close();
        showMainDialog();
    };
    
    dialog.show();
}

function addResponseToDocument(response, prompt) {
    try {
        var doc = app.activeDocument;
        var textLayer = doc.artLayers.add();
        textLayer.kind = LayerKind.TEXT;
        textLayer.name = "Gemini: " + prompt.substring(0, 20) + "...";
        
        var textItem = textLayer.textItem;
        textItem.contents = "GEMINI AI ANALYSIS\n" + new Date().toLocaleString() + "\n\nPrompt: " + prompt + "\n\n" + response;
        textItem.size = 12;
        textItem.position = [20, 50];
        
        log("Added text layer: " + textLayer.name);
    } catch(e) {
        log("Error adding text layer: " + e.message);
    }
}

function loadConfig() {
    try {
        var file = new File(CONFIG_FILE);
        if (file.exists) {
            file.open("r");
            var lines = file.read().split("\n");
            file.close();
            
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].indexOf("apiKey:") == 0) {
                    settings.apiKey = lines[i].substring(7);
                } else if (lines[i].indexOf("lastPrompt:") == 0) {
                    settings.lastPrompt = lines[i].substring(11);
                }
            }
            log("Config loaded successfully");
        }
    } catch(e) {
        log("Config load error: " + e.message);
    }
}

function saveConfig() {
    try {
        var file = new File(CONFIG_FILE);
        file.open("w");
        file.writeln("apiKey:" + settings.apiKey);
        file.writeln("model:" + settings.model);
        file.writeln("lastPrompt:" + settings.lastPrompt);
        file.close();
        log("Config saved successfully");
    } catch(e) {
        log("Config save error: " + e.message);
    }
}

// Initialize and run
log("Script loading...");
main();