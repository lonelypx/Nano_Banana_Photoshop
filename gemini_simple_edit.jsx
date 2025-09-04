// Simple Google Gemini Image Edit for Photoshop
// Direct integration with Google's Gemini API (no Replicate needed)

#target photoshop

// Settings
var settings = {
    apiKey: "",
    model: "gemini-1.5-flash",
    lastPrompt: "",
    createNewLayer: true
};

var CONFIG_FILE = Folder.userData + "/GeminiSimple_Config.txt";
var TEMP_FOLDER = Folder.temp + "/GeminiPhotoEdit/";

// Main function
function main() {
    try {
        // Initialize
        var folder = new Folder(TEMP_FOLDER);
        if (!folder.exists) folder.create();
        loadConfig();
        
        // Check document
        if (app.documents.length == 0) {
            alert("Please open a document first.");
            return;
        }
        
        // Check API key
        if (!settings.apiKey) {
            showApiKeyDialog();
            return;
        }
        
        // Show edit dialog
        showEditDialog();
        
    } catch(e) {
        alert("Error: " + e.message);
    }
}

// API Key setup
function showApiKeyDialog() {
    var dialog = new Window("dialog", "Google Gemini API Setup");
    dialog.orientation = "column";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    dialog.add("statictext", undefined, "🤖 Google Gemini Direct Integration");
    
    var instructGroup = dialog.add("group");
    instructGroup.orientation = "column";
    instructGroup.alignChildren = "left";
    instructGroup.add("statictext", undefined, "Quick Setup:");
    instructGroup.add("statictext", undefined, "1. Go to aistudio.google.com");
    instructGroup.add("statictext", undefined, "2. Click 'Get API Key'");
    instructGroup.add("statictext", undefined, "3. Copy your key and paste below");
    
    var keyGroup = dialog.add("group");
    keyGroup.add("statictext", undefined, "API Key:");
    var keyInput = keyGroup.add("edittext", undefined, settings.apiKey);
    keyInput.characters = 40;
    
    var btnGroup = dialog.add("group");
    var saveBtn = btnGroup.add("button", undefined, "Save");
    var helpBtn = btnGroup.add("button", undefined, "Help");
    
    helpBtn.onClick = function() {
        alert("Get your free API key at:\nhttps://aistudio.google.com/app/apikey\n\nThe Gemini API is free with rate limits.");
    };
    
    saveBtn.onClick = function() {
        if (!keyInput.text) {
            alert("Please enter your Google API key.");
            return;
        }
        settings.apiKey = keyInput.text;
        saveConfig();
        dialog.close();
        showEditDialog();
    };
    
    dialog.show();
}

// Main edit dialog
function showEditDialog() {
    var dialog = new Window("dialog", "Gemini Image Editor");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    dialog.add("statictext", undefined, "🎨 Gemini AI Image Analysis & Editing");
    
    // Selection status
    var hasSelection = checkSelection();
    var statusText = hasSelection ? "✓ Will analyze selected area" : "ℹ Will analyze entire image";
    dialog.add("statictext", undefined, statusText);
    
    // Prompt input
    var promptPanel = dialog.add("panel", undefined, "What do you want to do?");
    promptPanel.alignChildren = "fill";
    
    var promptInput = promptPanel.add("edittext", undefined, settings.lastPrompt, {multiline: true});
    promptInput.preferredSize.height = 100;
    promptInput.active = true;
    
    // Example prompts
    var exampleGroup = promptPanel.add("group");
    exampleGroup.orientation = "column";
    exampleGroup.alignChildren = "left";
    
    var exampleBtns = [
        {text: "Analyze this image", prompt: "Analyze this image and suggest 3 specific improvements I could make in Photoshop"},
        {text: "Remove background", prompt: "Provide step-by-step instructions to cleanly remove the background from this image"},
        {text: "Enhance lighting", prompt: "How can I improve the lighting and mood of this image? Give me specific Photoshop techniques"},
        {text: "Fix colors", prompt: "Analyze the colors in this image and suggest adjustments to make it more vibrant"}
    ];
    
    promptPanel.add("statictext", undefined, "Quick options:");
    var exampleRow1 = promptPanel.add("group");
    var exampleRow2 = promptPanel.add("group");
    
    for (var i = 0; i < exampleBtns.length; i++) {
        var btn = (i < 2 ? exampleRow1 : exampleRow2).add("button", undefined, exampleBtns[i].text);
        btn.helpTip = exampleBtns[i].prompt;
        btn.onClick = (function(prompt) {
            return function() {
                promptInput.text = prompt;
            };
        })(exampleBtns[i].prompt);
    }
    
    // Options
    var optPanel = dialog.add("panel", undefined, "Options");
    var newLayerCheck = optPanel.add("checkbox", undefined, "Add response as text layer");
    newLayerCheck.value = settings.createNewLayer;
    
    // Buttons
    var btnGroup = dialog.add("group");
    var analyzeBtn = btnGroup.add("button", undefined, "🔍 Analyze");
    var settingsBtn = btnGroup.add("button", undefined, "⚙️ Settings");
    var cancelBtn = btnGroup.add("button", undefined, "Cancel");
    
    analyzeBtn.onClick = function() {
        if (!promptInput.text) {
            alert("Please enter what you want to do with the image.");
            return;
        }
        
        settings.lastPrompt = promptInput.text;
        settings.createNewLayer = newLayerCheck.value;
        saveConfig();
        
        dialog.close();
        processWithGeminiSimple(promptInput.text);
    };
    
    settingsBtn.onClick = function() {
        dialog.close();
        showApiKeyDialog();
    };
    
    dialog.show();
}

// Simple Gemini processing
function processWithGeminiSimple(prompt) {
    try {
        // Export image
        var imagePath = exportCurrentImage();
        if (!imagePath) {
            alert("Failed to export image.");
            return;
        }
        
        // Show progress
        var progress = new Window("window", "Processing with Gemini...");
        progress.add("statictext", undefined, "Analyzing image and generating response...");
        progress.add("statictext", undefined, "This may take 10-30 seconds...");
        progress.show();
        
        // Create API request
        var requestFile = new File(TEMP_FOLDER + "simple_request.txt");
        requestFile.open("w");
        requestFile.writeln("apiKey:" + settings.apiKey);
        requestFile.writeln("model:" + settings.model);
        requestFile.writeln("imagePath:" + imagePath);
        requestFile.writeln("prompt:" + prompt);
        requestFile.close();
        
        // Execute
        var responsePath = TEMP_FOLDER + "simple_response.txt";
        var scriptPath = createSimpleGeminiScript(requestFile.fsName, responsePath);
        
        if ($.os.indexOf("Windows") > -1) {
            app.system('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        } else {
            app.system('chmod +x "' + scriptPath + '"');
            app.system('"' + scriptPath + '"');
        }
        
        progress.close();
        
        // Read response
        var response = readResponseFile(responsePath);
        showResponse(response, prompt);
        
        // Cleanup
        (new File(imagePath)).remove();
        requestFile.remove();
        (new File(responsePath)).remove();
        
    } catch(e) {
        alert("Error: " + e.message);
    }
}

// Create simple Gemini script
function createSimpleGeminiScript(requestPath, responsePath) {
    var scriptPath;
    
    if ($.os.indexOf("Windows") > -1) {
        scriptPath = TEMP_FOLDER + "simple_gemini.ps1";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('# Simple Gemini API call');
        script.writeln('$request = @{}');
        script.writeln('Get-Content "' + requestPath + '" | ForEach-Object {');
        script.writeln('    $parts = $_ -split ":", 2');
        script.writeln('    if ($parts.Length -eq 2) { $request[$parts[0]] = $parts[1] }');
        script.writeln('}');
        script.writeln('');
        script.writeln('$imageBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($request.imagePath))');
        script.writeln('');
        script.writeln('$body = @{');
        script.writeln('    contents = @(@{');
        script.writeln('        parts = @(');
        script.writeln('            @{ text = $request.prompt },');
        script.writeln('            @{ inline_data = @{ mime_type = "image/png"; data = $imageBase64 } }');
        script.writeln('        )');
        script.writeln('    })');
        script.writeln('} | ConvertTo-Json -Depth 10');
        script.writeln('');
        script.writeln('$url = "https://generativelanguage.googleapis.com/v1beta/models/" + $request.model + ":generateContent?key=" + $request.apiKey');
        script.writeln('');
        script.writeln('try {');
        script.writeln('    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"');
        script.writeln('    $response.candidates[0].content.parts[0].text | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('} catch {');
        script.writeln('    "API Error: " + $_.Exception.Message | Out-File "' + responsePath + '" -Encoding UTF8');
        script.writeln('}');
        
        script.close();
        
    } else {
        scriptPath = TEMP_FOLDER + "simple_gemini.sh";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('#!/bin/bash');
        script.writeln('');
        script.writeln('declare -A request');
        script.writeln('while IFS=: read -r key value; do');
        script.writeln('    request["$key"]="$value"');
        script.writeln('done < "' + requestPath + '"');
        script.writeln('');
        script.writeln('IMAGE_BASE64=$(base64 -i "${request[imagePath]}" | tr -d "\\n")');
        script.writeln('');
        script.writeln('JSON_PAYLOAD=$(cat <<EOF');
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
        script.writeln('curl -s -X POST \\');
        script.writeln('  -H "Content-Type: application/json" \\');
        script.writeln('  -d "$JSON_PAYLOAD" \\');
        script.writeln('  "https://generativelanguage.googleapis.com/v1beta/models/${request[model]}:generateContent?key=${request[apiKey]}" \\');
        script.writeln('  | python3 -c "');
        script.writeln('import sys, json');
        script.writeln('try:');
        script.writeln('  data = json.load(sys.stdin)');
        script.writeln('  print(data[\"candidates\"][0][\"content\"][\"parts\"][0][\"text\"])');
        script.writeln('except:');
        script.writeln('  print(\"Error parsing response\")');
        script.writeln('" > "' + responsePath + '"');
        
        script.close();
    }
    
    return scriptPath;
}

// Show response
function showResponse(response, prompt) {
    var responseDialog = new Window("dialog", "Gemini Analysis Results");
    responseDialog.orientation = "column";
    responseDialog.alignChildren = "fill";
    responseDialog.preferredSize.width = 600;
    responseDialog.spacing = 10;
    responseDialog.margins = 16;
    
    responseDialog.add("statictext", undefined, "Your request: " + prompt);
    
    var responseText = responseDialog.add("edittext", undefined, response, {multiline: true, readonly: true});
    responseText.preferredSize.height = 350;
    
    if (settings.createNewLayer) {
        addResponseToDocument(response, prompt);
    }
    
    var btnGroup = responseDialog.add("group");
    var newEditBtn = btnGroup.add("button", undefined, "New Edit");
    var closeBtn = btnGroup.add("button", undefined, "Close");
    
    newEditBtn.onClick = function() {
        responseDialog.close();
        showEditDialog();
    };
    
    responseDialog.show();
}

// Add response as text layer
function addResponseToDocument(response, prompt) {
    try {
        var doc = app.activeDocument;
        var textLayer = doc.artLayers.add();
        textLayer.kind = LayerKind.TEXT;
        textLayer.name = "Gemini: " + prompt.substring(0, 20) + "...";
        
        var textItem = textLayer.textItem;
        textItem.contents = "GEMINI AI ANALYSIS\n" + new Date().toLocaleString() + "\n\nPrompt: " + prompt + "\n\n" + response;
        textItem.size = 12;
        textItem.color = new SolidColor();
        textItem.color.rgb.red = 0;
        textItem.color.rgb.green = 0;
        textItem.color.rgb.blue = 0;
        
        textItem.position = [20, 50];
        
    } catch(e) {}
}

// Helper functions
function exportCurrentImage() {
    try {
        var doc = app.activeDocument;
        var file = new File(TEMP_FOLDER + "current_" + Date.now() + ".png");
        
        if (checkSelection()) {
            doc.selection.copy();
            var bounds = doc.selection.bounds;
            var width = bounds[2] - bounds[0];
            var height = bounds[3] - bounds[1];
            var tempDoc = app.documents.add(width, height, doc.resolution, "Temp", NewDocumentMode.RGB);
            tempDoc.paste();
            
            var pngOptions = new PNGSaveOptions();
            tempDoc.saveAs(file, pngOptions, true);
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        } else {
            var pngOptions = new PNGSaveOptions();
            doc.saveAs(file, pngOptions, true);
        }
        
        return file.fsName;
    } catch(e) {
        return null;
    }
}

function checkSelection() {
    try {
        var bounds = app.activeDocument.selection.bounds;
        return (bounds[0] != bounds[2] && bounds[1] != bounds[3]);
    } catch(e) {
        return false;
    }
}

function readResponseFile(path) {
    try {
        var file = new File(path);
        if (file.exists) {
            file.open("r");
            var content = file.read();
            file.close();
            return content || "No response received.";
        }
        return "Response file not found.";
    } catch(e) {
        return "Error reading response.";
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
        }
    } catch(e) {}
}

function saveConfig() {
    try {
        var file = new File(CONFIG_FILE);
        file.open("w");
        file.writeln("apiKey:" + settings.apiKey);
        file.writeln("model:" + settings.model);
        file.writeln("lastPrompt:" + settings.lastPrompt);
        file.close();
    } catch(e) {}
}

// Run
main();