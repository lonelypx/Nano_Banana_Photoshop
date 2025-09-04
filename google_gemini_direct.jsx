// Google Gemini Direct API Script for Photoshop
// Uses Google's Gemini API directly without Replicate.com

#target photoshop

// Constants
var SCRIPT_VERSION = "1.0.0";
var GEMINI_MODELS = {
    "gemini-pro-vision": {
        name: "Gemini Pro Vision",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent",
        features: ["image_understanding", "editing_instructions"],
        description: "Best for image analysis and editing"
    },
    "gemini-pro": {
        name: "Gemini Pro", 
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        features: ["text_generation"],
        description: "Text-only model"
    },
    "gemini-1.5-flash": {
        name: "Gemini 1.5 Flash",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        features: ["multimodal", "fast_processing"],
        description: "Fast multimodal processing"
    },
    "gemini-1.5-pro": {
        name: "Gemini 1.5 Pro",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
        features: ["multimodal", "high_quality"],
        description: "High quality multimodal model"
    }
};

// Global settings
var settings = {
    googleApiKey: "",
    selectedModel: "gemini-1.5-flash",
    lastPrompt: "",
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 2048,
    options: {
        createNewLayer: true,
        saveHistory: true
    }
};

var CONFIG_FILE = Folder.userData + "/GoogleGeminiPhotoshop_Config.json";
var TEMP_FOLDER = Folder.temp + "/PhotoshopGeminiEdit/";

// Initialize
function initialize() {
    var folder = new Folder(TEMP_FOLDER);
    if (!folder.exists) {
        folder.create();
    }
    loadSettings();
}

// Main function
function main() {
    try {
        initialize();
        
        if (app.documents.length == 0) {
            alert("Please open a document before running this script.");
            return;
        }
        
        if (!settings.googleApiKey) {
            showSettingsDialog();
            return;
        }
        
        showMainDialog();
        
    } catch(e) {
        alert("Error: " + e.message);
    }
}

// Settings Dialog
function showSettingsDialog() {
    var dialog = new Window("dialog", "Google Gemini API Settings");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Title
    dialog.add("statictext", undefined, "Google Gemini Direct Integration v" + SCRIPT_VERSION);
    
    // API Key section
    var apiPanel = dialog.add("panel", undefined, "Google API Configuration");
    apiPanel.alignChildren = "fill";
    
    var apiKeyGroup = apiPanel.add("group");
    apiKeyGroup.add("statictext", undefined, "API Key:");
    var apiKeyInput = apiKeyGroup.add("edittext", undefined, settings.googleApiKey);
    apiKeyInput.characters = 45;
    
    // Model selection
    var modelPanel = dialog.add("panel", undefined, "Model Selection");
    modelPanel.alignChildren = "fill";
    
    var modelRadios = {};
    for (var key in GEMINI_MODELS) {
        var model = GEMINI_MODELS[key];
        var radio = modelPanel.add("radiobutton", undefined, model.name + " - " + model.description);
        modelRadios[key] = radio;
        if (settings.selectedModel == key) {
            radio.value = true;
        }
    }
    
    // Advanced settings
    var advPanel = dialog.add("panel", undefined, "Advanced Settings");
    advPanel.orientation = "column";
    advPanel.alignChildren = "fill";
    
    var tempGroup = advPanel.add("group");
    tempGroup.add("statictext", undefined, "Temperature (0-1):");
    var tempSlider = tempGroup.add("slider", undefined, settings.temperature, 0, 1);
    var tempValue = tempGroup.add("statictext", undefined, settings.temperature.toFixed(2));
    tempSlider.onChanging = function() {
        tempValue.text = this.value.toFixed(2);
    };
    
    // Instructions
    var infoPanel = dialog.add("panel", undefined, "Setup Instructions");
    infoPanel.alignChildren = "left";
    var instructions = [
        "1. Go to console.cloud.google.com",
        "2. Create a new project or select existing",
        "3. Enable the Generative Language API",
        "4. Create credentials (API Key)",
        "5. Copy the API key and paste above"
    ];
    for (var i = 0; i < instructions.length; i++) {
        infoPanel.add("statictext", undefined, instructions[i]);
    }
    
    // Add link button
    var linkBtn = infoPanel.add("button", undefined, "Open Google Cloud Console");
    linkBtn.onClick = function() {
        alert("Go to: https://console.cloud.google.com/apis/credentials");
    };
    
    // Buttons
    var buttonGroup = dialog.add("group");
    var saveBtn = buttonGroup.add("button", undefined, "Save Settings");
    var cancelBtn = buttonGroup.add("button", undefined, "Cancel");
    
    saveBtn.onClick = function() {
        if (!apiKeyInput.text) {
            alert("Please enter your Google API key.");
            return;
        }
        
        settings.googleApiKey = apiKeyInput.text;
        settings.temperature = tempSlider.value;
        
        for (var key in modelRadios) {
            if (modelRadios[key].value) {
                settings.selectedModel = key;
                break;
            }
        }
        
        saveSettings();
        dialog.close();
        showMainDialog();
    };
    
    dialog.show();
}

// Main Dialog
function showMainDialog() {
    var dialog = new Window("dialog", "Google Gemini Image Edit");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Model info
    var modelInfo = dialog.add("statictext", undefined, "Using: " + GEMINI_MODELS[settings.selectedModel].name);
    modelInfo.graphics.font = ScriptUI.newFont(modelInfo.graphics.font.name, "BOLD", modelInfo.graphics.font.size);
    
    // Check selection
    var hasSelection = checkSelection();
    if (!hasSelection) {
        dialog.add("statictext", undefined, "ℹ No selection - will analyze entire image");
    }
    
    // System prompt (for image editing instructions)
    var systemPanel = dialog.add("panel", undefined, "System Instructions");
    systemPanel.alignChildren = "fill";
    var systemPrompt = systemPanel.add("edittext", undefined, "You are an image editing AI assistant. Analyze the provided image and suggest edits based on the user's request. Provide detailed, actionable instructions for achieving the desired result in Photoshop.", {multiline: true});
    systemPrompt.preferredSize.height = 60;
    
    // User prompt
    var promptPanel = dialog.add("panel", undefined, "Your Request");
    promptPanel.alignChildren = "fill";
    var promptInput = promptPanel.add("edittext", undefined, settings.lastPrompt, {multiline: true});
    promptInput.preferredSize.height = 80;
    promptInput.active = true;
    
    // Examples
    promptPanel.add("statictext", undefined, "Examples: \"How to make this look vintage?\", \"Steps to remove background?\", \"Create a dramatic look\"");
    
    // Options
    var optionsPanel = dialog.add("panel", undefined, "Options");
    var newLayerCheck = optionsPanel.add("checkbox", undefined, "Create instructions as new text layer");
    newLayerCheck.value = settings.options.createNewLayer;
    
    // Progress (hidden)
    var progressGroup = dialog.add("group");
    progressGroup.visible = false;
    var progressText = progressGroup.add("statictext", undefined, "Processing...");
    
    // Buttons
    var buttonGroup = dialog.add("group");
    var analyzeBtn = buttonGroup.add("button", undefined, "Analyze & Get Instructions");
    var settingsBtn = buttonGroup.add("button", undefined, "Settings");
    var cancelBtn = buttonGroup.add("button", undefined, "Cancel");
    
    analyzeBtn.onClick = function() {
        if (!promptInput.text) {
            alert("Please describe what you want to do with the image.");
            return;
        }
        
        settings.lastPrompt = promptInput.text;
        settings.options.createNewLayer = newLayerCheck.value;
        saveSettings();
        
        analyzeBtn.enabled = false;
        progressGroup.visible = true;
        
        processWithGemini(systemPrompt.text, promptInput.text, function(success, result) {
            dialog.close();
            if (success && result) {
                displayResults(result, promptInput.text);
            }
        });
    };
    
    settingsBtn.onClick = function() {
        dialog.close();
        showSettingsDialog();
    };
    
    dialog.show();
}

// Process with Gemini API
function processWithGemini(systemPrompt, userPrompt, callback) {
    try {
        // Export current image/selection
        var imagePath = exportSelection();
        if (!imagePath) {
            alert("Failed to export image.");
            callback(false);
            return;
        }
        
        // Prepare API request
        var requestData = {
            apiKey: settings.googleApiKey,
            model: settings.selectedModel,
            endpoint: GEMINI_MODELS[settings.selectedModel].endpoint,
            imagePath: imagePath,
            systemPrompt: systemPrompt,
            userPrompt: userPrompt,
            temperature: settings.temperature,
            topK: settings.topK,
            topP: settings.topP,
            maxOutputTokens: settings.maxOutputTokens
        };
        
        // Create request file
        var requestFile = new File(TEMP_FOLDER + "gemini_request.json");
        requestFile.open("w");
        for (var key in requestData) {
            requestFile.writeln(key + ":" + requestData[key]);
        }
        requestFile.close();
        
        // Execute API call
        var responseFile = TEMP_FOLDER + "gemini_response.txt";
        var success = executeGeminiAPI(requestFile.fsName, responseFile);
        
        if (success && (new File(responseFile)).exists) {
            var response = readResponseFile(responseFile);
            callback(true, response);
        } else {
            alert("Failed to get response from Gemini API.");
            callback(false);
        }
        
        // Cleanup
        (new File(imagePath)).remove();
        
    } catch(e) {
        alert("Error: " + e.message);
        callback(false);
    }
}

// Execute Gemini API call
function executeGeminiAPI(requestPath, responsePath) {
    try {
        var scriptPath;
        var command;
        
        if ($.os.indexOf("Windows") > -1) {
            scriptPath = TEMP_FOLDER + "gemini_api.ps1";
            createWindowsGeminiScript(scriptPath, requestPath, responsePath);
            command = 'powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"';
        } else {
            scriptPath = TEMP_FOLDER + "gemini_api.sh";
            createMacGeminiScript(scriptPath, requestPath, responsePath);
            app.system('chmod +x "' + scriptPath + '"');
            command = '"' + scriptPath + '"';
        }
        
        app.system(command);
        
        return (new File(responsePath)).exists;
        
    } catch(e) {
        alert("API execution error: " + e.message);
        return false;
    }
}

// Create Windows Gemini API script
function createWindowsGeminiScript(scriptPath, requestPath, responsePath) {
    var script = new File(scriptPath);
    script.open("w");
    
    script.writeln('# Google Gemini API Script for Windows');
    script.writeln('$ErrorActionPreference = "Stop"');
    script.writeln('');
    script.writeln('# Read request data');
    script.writeln('$request = @{}');
    script.writeln('Get-Content "' + requestPath + '" | ForEach-Object {');
    script.writeln('    $parts = $_ -split ":", 2');
    script.writeln('    if ($parts.Length -eq 2) {');
    script.writeln('        $request[$parts[0]] = $parts[1]');
    script.writeln('    }');
    script.writeln('}');
    script.writeln('');
    script.writeln('# Read and encode image');
    script.writeln('$imageBytes = [System.IO.File]::ReadAllBytes($request.imagePath)');
    script.writeln('$imageBase64 = [System.Convert]::ToBase64String($imageBytes)');
    script.writeln('');
    script.writeln('# Prepare API request');
    script.writeln('$apiUrl = $request.endpoint + "?key=" + $request.apiKey');
    script.writeln('');
    script.writeln('$body = @{');
    script.writeln('    contents = @(');
    script.writeln('        @{');
    script.writeln('            parts = @(');
    script.writeln('                @{');
    script.writeln('                    text = $request.systemPrompt + "`n`nUser request: " + $request.userPrompt');
    script.writeln('                },');
    script.writeln('                @{');
    script.writeln('                    inline_data = @{');
    script.writeln('                        mime_type = "image/jpeg"');
    script.writeln('                        data = $imageBase64');
    script.writeln('                    }');
    script.writeln('                }');
    script.writeln('            )');
    script.writeln('        }');
    script.writeln('    )');
    script.writeln('    generationConfig = @{');
    script.writeln('        temperature = [double]$request.temperature');
    script.writeln('        topK = [int]$request.topK');
    script.writeln('        topP = [double]$request.topP');
    script.writeln('        maxOutputTokens = [int]$request.maxOutputTokens');
    script.writeln('    }');
    script.writeln('} | ConvertTo-Json -Depth 10');
    script.writeln('');
    script.writeln('try {');
    script.writeln('    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"');
    script.writeln('    if ($response.candidates -and $response.candidates[0].content.parts[0].text) {');
    script.writeln('        $response.candidates[0].content.parts[0].text | Out-File -FilePath "' + responsePath + '" -Encoding UTF8');
    script.writeln('    }');
    script.writeln('} catch {');
    script.writeln('    $_.Exception.Message | Out-File -FilePath "' + responsePath + '.error" -Encoding UTF8');
    script.writeln('}');
    
    script.close();
}

// Create Mac Gemini API script
function createMacGeminiScript(scriptPath, requestPath, responsePath) {
    var script = new File(scriptPath);
    script.open("w");
    
    script.writeln('#!/bin/bash');
    script.writeln('');
    script.writeln('# Google Gemini API Script for macOS');
    script.writeln('');
    script.writeln('# Read request data');
    script.writeln('declare -A request');
    script.writeln('while IFS=: read -r key value; do');
    script.writeln('    request["$key"]="$value"');
    script.writeln('done < "' + requestPath + '"');
    script.writeln('');
    script.writeln('# Encode image to base64');
    script.writeln('IMAGE_BASE64=$(base64 -i "${request[imagePath]}" | tr -d "\\n")');
    script.writeln('');
    script.writeln('# Prepare API URL');
    script.writeln('API_URL="${request[endpoint]}?key=${request[apiKey]}"');
    script.writeln('');
    script.writeln('# Create JSON payload');
    script.writeln('JSON_PAYLOAD=$(cat <<EOF');
    script.writeln('{');
    script.writeln('  "contents": [{');
    script.writeln('    "parts": [');
    script.writeln('      {');
    script.writeln('        "text": "${request[systemPrompt]}\\n\\nUser request: ${request[userPrompt]}"');
    script.writeln('      },');
    script.writeln('      {');
    script.writeln('        "inline_data": {');
    script.writeln('          "mime_type": "image/jpeg",');
    script.writeln('          "data": "$IMAGE_BASE64"');
    script.writeln('        }');
    script.writeln('      }');
    script.writeln('    ]');
    script.writeln('  }],');
    script.writeln('  "generationConfig": {');
    script.writeln('    "temperature": ${request[temperature]},');
    script.writeln('    "topK": ${request[topK]},');
    script.writeln('    "topP": ${request[topP]},');
    script.writeln('    "maxOutputTokens": ${request[maxOutputTokens]}');
    script.writeln('  }');
    script.writeln('}');
    script.writeln('EOF');
    script.writeln(')');
    script.writeln('');
    script.writeln('# Make API call');
    script.writeln('RESPONSE=$(curl -s -X POST \\');
    script.writeln('  -H "Content-Type: application/json" \\');
    script.writeln('  -d "$JSON_PAYLOAD" \\');
    script.writeln('  "$API_URL")');
    script.writeln('');
    script.writeln('# Extract text from response');
    script.writeln('echo "$RESPONSE" | python3 -c "');
    script.writeln('import sys, json');
    script.writeln('try:');
    script.writeln('    data = json.load(sys.stdin)');
    script.writeln('    text = data[\"candidates\"][0][\"content\"][\"parts\"][0][\"text\"]');
    script.writeln('    print(text)');
    script.writeln('except:');
    script.writeln('    print(\"Error parsing response\")');
    script.writeln('" > "' + responsePath + '"');
    
    script.close();
}

// Display results
function displayResults(response, prompt) {
    try {
        var doc = app.activeDocument;
        
        if (settings.options.createNewLayer) {
            // Create a new text layer with the response
            var textLayer = doc.artLayers.add();
            textLayer.kind = LayerKind.TEXT;
            textLayer.name = "Gemini Analysis - " + prompt.substring(0, 30);
            
            var textItem = textLayer.textItem;
            textItem.contents = "GEMINI AI ANALYSIS\n\nPrompt: " + prompt + "\n\n" + response;
            textItem.size = 14;
            textItem.font = "Arial";
            
            // Position at top of document
            textItem.position = [50, 50];
            
            // Create background for readability
            var bgLayer = doc.artLayers.add();
            bgLayer.name = "Analysis Background";
            doc.activeLayer = bgLayer;
            
            // Fill with white
            var white = new SolidColor();
            white.rgb.red = 255;
            white.rgb.green = 255;
            white.rgb.blue = 255;
            doc.selection.selectAll();
            doc.selection.fill(white);
            doc.selection.deselect();
            
            // Set opacity
            bgLayer.opacity = 90;
            
            // Move behind text
            bgLayer.move(textLayer, ElementPlacement.PLACEAFTER);
        }
        
        // Also show in dialog
        var resultDialog = new Window("dialog", "Gemini Analysis Results");
        resultDialog.orientation = "column";
        resultDialog.alignChildren = "fill";
        resultDialog.preferredSize.width = 600;
        
        resultDialog.add("statictext", undefined, "Prompt: " + prompt);
        
        var resultText = resultDialog.add("edittext", undefined, response, {multiline: true, readonly: true});
        resultText.preferredSize.height = 400;
        
        var btnGroup = resultDialog.add("group");
        btnGroup.alignment = "center";
        var copyBtn = btnGroup.add("button", undefined, "Copy to Clipboard");
        var closeBtn = btnGroup.add("button", undefined, "Close");
        
        copyBtn.onClick = function() {
            alert("Response copied!\n\nNote: ExtendScript doesn't support clipboard directly. Select and copy the text manually.");
        };
        
        resultDialog.show();
        
    } catch(e) {
        alert("Error displaying results: " + e.message);
    }
}

// Helper functions
function checkSelection() {
    try {
        var bounds = app.activeDocument.selection.bounds;
        return (bounds[0] != bounds[2] && bounds[1] != bounds[3]);
    } catch(e) {
        return false;
    }
}

function exportSelection() {
    try {
        var doc = app.activeDocument;
        var exportDoc;
        
        if (checkSelection()) {
            doc.selection.copy();
            var bounds = doc.selection.bounds;
            var width = bounds[2] - bounds[0];
            var height = bounds[3] - bounds[1];
            exportDoc = app.documents.add(width, height, doc.resolution, "TempExport", NewDocumentMode.RGB);
            exportDoc.paste();
        } else {
            exportDoc = doc;
        }
        
        var file = new File(TEMP_FOLDER + "export_" + Date.now() + ".jpg");
        var saveOptions = new JPEGSaveOptions();
        saveOptions.quality = 10;
        
        exportDoc.saveAs(file, saveOptions, true);
        
        if (exportDoc != doc) {
            exportDoc.close(SaveOptions.DONOTSAVECHANGES);
        }
        
        return file.fsName;
        
    } catch(e) {
        return null;
    }
}

function readResponseFile(filePath) {
    try {
        var file = new File(filePath);
        if (file.exists) {
            file.open("r");
            var content = file.read();
            file.close();
            return content;
        }
        return "No response received.";
    } catch(e) {
        return "Error reading response: " + e.message;
    }
}

function loadSettings() {
    try {
        var file = new File(CONFIG_FILE);
        if (file.exists) {
            file.open("r");
            var content = file.read();
            file.close();
            
            var lines = content.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.indexOf("googleApiKey:") == 0) {
                    settings.googleApiKey = line.substring(13).replace(/^\s+|\s+$/g, "");
                } else if (line.indexOf("selectedModel:") == 0) {
                    settings.selectedModel = line.substring(14).replace(/^\s+|\s+$/g, "");
                } else if (line.indexOf("temperature:") == 0) {
                    settings.temperature = parseFloat(line.substring(12));
                }
            }
        }
    } catch(e) {}
}

function saveSettings() {
    try {
        var file = new File(CONFIG_FILE);
        file.open("w");
        
        file.writeln("googleApiKey:" + settings.googleApiKey);
        file.writeln("selectedModel:" + settings.selectedModel);
        file.writeln("temperature:" + settings.temperature);
        file.writeln("topK:" + settings.topK);
        file.writeln("topP:" + settings.topP);
        file.writeln("maxOutputTokens:" + settings.maxOutputTokens);
        
        file.close();
    } catch(e) {}
}

// Run
main();