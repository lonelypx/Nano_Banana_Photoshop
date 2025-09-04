// Google Imagen API Direct Integration for Photoshop
// Uses Google's Vertex AI Imagen API for actual image editing

#target photoshop

// Constants
var GOOGLE_APIS = {
    "imagen-2": {
        name: "Google Imagen 2.0",
        endpoint: "https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-2:predict",
        features: ["image_editing", "inpainting", "outpainting"],
        description: "Google's latest image generation model"
    },
    "imagen-3": {
        name: "Google Imagen 3.0", 
        endpoint: "https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3:predict",
        features: ["image_editing", "high_quality", "text_rendering"],
        description: "Highest quality Google image model"
    },
    "gemini-exp": {
        name: "Gemini with Image Generation",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-exp:generateContent",
        features: ["multimodal", "experimental"],
        description: "Experimental Gemini with image capabilities"
    }
};

// Global settings
var settings = {
    googleApiKey: "",
    projectId: "",
    selectedModel: "imagen-2",
    authMethod: "api_key", // or "service_account"
    serviceAccountPath: "",
    lastPrompt: "",
    options: {
        editMode: "inpaint", // "inpaint", "outpaint", "replace"
        guidanceScale: 7.5,
        steps: 20,
        seed: -1,
        createNewLayer: true
    }
};

var CONFIG_FILE = Folder.userData + "/GoogleImagenPhotoshop_Config.json";
var TEMP_FOLDER = Folder.temp + "/PhotoshopImagenEdit/";

// Main function
function main() {
    try {
        initialize();
        
        if (app.documents.length == 0) {
            alert("Please open a document before running this script.");
            return;
        }
        
        if (!settings.googleApiKey && !settings.serviceAccountPath) {
            showSetupDialog();
            return;
        }
        
        showMainDialog();
        
    } catch(e) {
        alert("Error: " + e.message);
    }
}

function initialize() {
    var folder = new Folder(TEMP_FOLDER);
    if (!folder.exists) {
        folder.create();
    }
    loadSettings();
}

// Setup Dialog with Google Cloud instructions
function showSetupDialog() {
    var dialog = new Window("dialog", "Google Imagen API Setup");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Title
    var titleText = dialog.add("statictext", undefined, "Google Cloud Imagen API Setup");
    titleText.graphics.font = ScriptUI.newFont(titleText.graphics.font.name, "BOLD", 16);
    
    // Instructions panel
    var instructPanel = dialog.add("panel", undefined, "Setup Instructions");
    instructPanel.alignChildren = "left";
    
    var steps = [
        "1. Go to console.cloud.google.com",
        "2. Create a new project or select existing",
        "3. Enable the 'Vertex AI API'",
        "4. Go to 'APIs & Services' > 'Credentials'",
        "5. Create an API key or service account",
        "6. Copy your project ID and credentials below"
    ];
    
    for (var i = 0; i < steps.length; i++) {
        instructPanel.add("statictext", undefined, steps[i]);
    }
    
    var linkBtn = instructPanel.add("button", undefined, "Open Google Cloud Console");
    linkBtn.onClick = function() {
        alert("Navigate to: https://console.cloud.google.com/apis/credentials");
    };
    
    // Configuration panel
    var configPanel = dialog.add("panel", undefined, "Configuration");
    configPanel.alignChildren = "fill";
    
    // Project ID
    var projectGroup = configPanel.add("group");
    projectGroup.add("statictext", undefined, "Project ID:");
    var projectInput = projectGroup.add("edittext", undefined, settings.projectId);
    projectInput.characters = 30;
    
    // Auth method selection
    var authGroup = configPanel.add("group");
    authGroup.orientation = "column";
    authGroup.alignChildren = "left";
    
    authGroup.add("statictext", undefined, "Authentication Method:");
    var apiKeyRadio = authGroup.add("radiobutton", undefined, "API Key (Simpler)");
    var serviceAccountRadio = authGroup.add("radiobutton", undefined, "Service Account (More secure)");
    
    apiKeyRadio.value = (settings.authMethod == "api_key");
    serviceAccountRadio.value = (settings.authMethod == "service_account");
    
    // API Key input
    var apiKeyGroup = configPanel.add("group");
    apiKeyGroup.add("statictext", undefined, "API Key:");
    var apiKeyInput = apiKeyGroup.add("edittext", undefined, settings.googleApiKey);
    apiKeyInput.characters = 40;
    
    // Service Account input
    var saGroup = configPanel.add("group");
    saGroup.add("statictext", undefined, "Service Account JSON:");
    var saPathInput = saGroup.add("edittext", undefined, settings.serviceAccountPath);
    saPathInput.characters = 30;
    var browseSABtn = saGroup.add("button", undefined, "Browse...");
    
    browseSABtn.onClick = function() {
        var file = File.openDialog("Select Service Account JSON", "*.json");
        if (file) {
            settings.serviceAccountPath = file.fsName;
            saPathInput.text = file.fsName;
        }
    };
    
    // Model selection
    var modelPanel = dialog.add("panel", undefined, "Model Selection");
    var modelRadios = {};
    for (var key in GOOGLE_APIS) {
        var model = GOOGLE_APIS[key];
        var radio = modelPanel.add("radiobutton", undefined, model.name + " - " + model.description);
        modelRadios[key] = radio;
        if (settings.selectedModel == key) {
            radio.value = true;
        }
    }
    
    // Save button
    var saveBtn = dialog.add("button", undefined, "Save Configuration");
    
    saveBtn.onClick = function() {
        if (!projectInput.text) {
            alert("Please enter your Google Cloud Project ID.");
            return;
        }
        
        settings.projectId = projectInput.text;
        settings.authMethod = apiKeyRadio.value ? "api_key" : "service_account";
        settings.googleApiKey = apiKeyInput.text;
        settings.serviceAccountPath = saPathInput.text;
        
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

// Main editing dialog
function showMainDialog() {
    var dialog = new Window("dialog", "Google Imagen Image Editor");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Header
    var headerGroup = dialog.add("group");
    headerGroup.add("statictext", undefined, "🤖 Google Imagen Editor");
    var modelLabel = headerGroup.add("statictext", undefined, GOOGLE_APIS[settings.selectedModel].name);
    modelLabel.graphics.font = ScriptUI.newFont(modelLabel.graphics.font.name, "ITALIC", 10);
    
    // Selection info
    var hasSelection = checkSelection();
    var selectionInfo = dialog.add("statictext", undefined, 
        hasSelection ? "✓ Selection detected - will edit selected area" : "ℹ No selection - will process entire image");
    
    // Prompt
    var promptPanel = dialog.add("panel", undefined, "Editing Instructions");
    promptPanel.alignChildren = "fill";
    var promptInput = promptPanel.add("edittext", undefined, settings.lastPrompt, {multiline: true});
    promptInput.preferredSize.height = 80;
    
    // Examples
    var exampleText = promptPanel.add("statictext", undefined, "Examples: \"add a rainbow in the sky\", \"make the person smile\", \"change background to beach\"");
    exampleText.graphics.font = ScriptUI.newFont(exampleText.graphics.font.name, "ITALIC", 9);
    
    // Edit mode
    var modePanel = dialog.add("panel", undefined, "Edit Mode");
    modePanel.orientation = "row";
    
    var inpaintRadio = modePanel.add("radiobutton", undefined, "Inpaint (edit selection)");
    var outpaintRadio = modePanel.add("radiobutton", undefined, "Outpaint (extend image)");
    var replaceRadio = modePanel.add("radiobutton", undefined, "Replace (full replacement)");
    
    inpaintRadio.value = (settings.options.editMode == "inpaint");
    outpaintRadio.value = (settings.options.editMode == "outpaint");
    replaceRadio.value = (settings.options.editMode == "replace");
    
    // Advanced options
    var advPanel = dialog.add("panel", undefined, "Advanced Options");
    
    var guidanceGroup = advPanel.add("group");
    guidanceGroup.add("statictext", undefined, "Guidance Scale (1-20):");
    var guidanceSlider = guidanceGroup.add("slider", undefined, settings.options.guidanceScale, 1, 20);
    var guidanceValue = guidanceGroup.add("statictext", undefined, settings.options.guidanceScale.toFixed(1));
    guidanceSlider.onChanging = function() {
        guidanceValue.text = this.value.toFixed(1);
    };
    
    var stepsGroup = advPanel.add("group");
    stepsGroup.add("statictext", undefined, "Steps (10-50):");
    var stepsSlider = stepsGroup.add("slider", undefined, settings.options.steps, 10, 50);
    var stepsValue = stepsGroup.add("statictext", undefined, settings.options.steps);
    stepsSlider.onChanging = function() {
        stepsValue.text = Math.round(this.value);
    };
    
    var newLayerCheck = advPanel.add("checkbox", undefined, "Create result as new layer");
    newLayerCheck.value = settings.options.createNewLayer;
    
    // Progress (hidden)
    var progressGroup = dialog.add("group");
    progressGroup.visible = false;
    var progressBar = progressGroup.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize.width = 400;
    var progressText = progressGroup.add("statictext", undefined, "");
    
    // Buttons
    var buttonGroup = dialog.add("group");
    var editBtn = buttonGroup.add("button", undefined, "🎨 Generate Edit");
    var setupBtn = buttonGroup.add("button", undefined, "⚙️ Setup");
    var helpBtn = buttonGroup.add("button", undefined, "❓ Help");
    var cancelBtn = buttonGroup.add("button", undefined, "Cancel");
    
    editBtn.onClick = function() {
        if (!promptInput.text) {
            alert("Please describe what changes you want to make.");
            return;
        }
        
        // Update settings
        settings.lastPrompt = promptInput.text;
        settings.options.editMode = inpaintRadio.value ? "inpaint" : outpaintRadio.value ? "outpaint" : "replace";
        settings.options.guidanceScale = guidanceSlider.value;
        settings.options.steps = Math.round(stepsSlider.value);
        settings.options.createNewLayer = newLayerCheck.value;
        saveSettings();
        
        editBtn.enabled = false;
        progressGroup.visible = true;
        
        processImageEdit(promptInput.text, settings.options, progressBar, progressText, function(success) {
            dialog.close();
            if (success) {
                alert("✨ Image edit completed successfully!");
            }
        });
    };
    
    setupBtn.onClick = function() {
        dialog.close();
        showSetupDialog();
    };
    
    helpBtn.onClick = function() {
        showHelpDialog();
    };
    
    dialog.show();
}

// Help dialog
function showHelpDialog() {
    var helpDialog = new Window("dialog", "Google Imagen Help");
    helpDialog.orientation = "column";
    helpDialog.alignChildren = "fill";
    helpDialog.preferredSize.width = 500;
    
    var helpText = helpDialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    helpText.preferredSize.height = 300;
    
    helpText.text = "GOOGLE IMAGEN PHOTOSHOP INTEGRATION\n\n" +
        "SETUP REQUIREMENTS:\n" +
        "• Google Cloud Platform account\n" +
        "• Vertex AI API enabled\n" +
        "• Valid project ID and API key\n\n" +
        "USAGE:\n" +
        "1. Make a selection (optional)\n" +
        "2. Enter editing instructions\n" +
        "3. Choose edit mode:\n" +
        "   • Inpaint: Edit selected area\n" +
        "   • Outpaint: Extend image beyond borders\n" +
        "   • Replace: Complete replacement\n" +
        "4. Adjust advanced settings if needed\n" +
        "5. Click Generate Edit\n\n" +
        "PROMPT TIPS:\n" +
        "• Be specific: \"add blue sky with clouds\"\n" +
        "• Mention style: \"in photorealistic style\"\n" +
        "• Use lighting: \"with dramatic lighting\"\n" +
        "• Specify mood: \"make it cheerful and bright\"\n\n" +
        "MODELS:\n" +
        "• Imagen 2.0: Fast, good quality\n" +
        "• Imagen 3.0: Highest quality, slower\n" +
        "• Gemini Exp: Experimental features\n\n" +
        "TROUBLESHOOTING:\n" +
        "• Check internet connection\n" +
        "• Verify API key and project ID\n" +
        "• Ensure Vertex AI is enabled\n" +
        "• Check Google Cloud billing";
    
    var closeBtn = helpDialog.add("button", undefined, "Close");
    helpDialog.show();
}

// Process image edit with Google API
function processImageEdit(prompt, options, progressBar, progressText, callback) {
    try {
        progressText.text = "Exporting image...";
        progressBar.value = 10;
        
        var doc = app.activeDocument;
        var imagePath = exportSelection();
        
        if (!imagePath) {
            alert("Failed to export image for processing.");
            callback(false);
            return;
        }
        
        progressText.text = "Preparing API request...";
        progressBar.value = 20;
        
        // Create request
        var requestData = {
            apiKey: settings.googleApiKey,
            projectId: settings.projectId,
            model: settings.selectedModel,
            endpoint: GOOGLE_APIS[settings.selectedModel].endpoint.replace("{PROJECT_ID}", settings.projectId),
            imagePath: imagePath,
            prompt: prompt,
            editMode: options.editMode,
            guidanceScale: options.guidanceScale,
            steps: options.steps,
            seed: options.seed
        };
        
        var requestFile = new File(TEMP_FOLDER + "google_request.json");
        writeRequestFile(requestFile, requestData);
        
        progressText.text = "Calling Google Imagen API...";
        progressBar.value = 30;
        
        var outputPath = TEMP_FOLDER + "google_result.png";
        var success = executeGoogleAPI(requestFile.fsName, outputPath, progressBar, progressText);
        
        if (success && (new File(outputPath)).exists) {
            progressText.text = "Importing result...";
            progressBar.value = 90;
            
            importGoogleResult(outputPath, options);
            
            progressBar.value = 100;
            callback(true);
        } else {
            var errorFile = new File(outputPath + ".error");
            var errorMsg = "Unknown error";
            if (errorFile.exists) {
                errorFile.open("r");
                errorMsg = errorFile.read();
                errorFile.close();
            }
            alert("Google API Error: " + errorMsg);
            callback(false);
        }
        
        // Cleanup
        (new File(imagePath)).remove();
        requestFile.remove();
        
    } catch(e) {
        alert("Processing error: " + e.message);
        callback(false);
    }
}

// Execute Google API call
function executeGoogleAPI(requestPath, outputPath, progressBar, progressText) {
    try {
        var scriptPath;
        
        if ($.os.indexOf("Windows") > -1) {
            scriptPath = TEMP_FOLDER + "google_api.ps1";
            createWindowsGoogleScript(scriptPath, requestPath, outputPath);
            app.system('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        } else {
            scriptPath = TEMP_FOLDER + "google_api.sh";
            createMacGoogleScript(scriptPath, requestPath, outputPath);
            app.system('chmod +x "' + scriptPath + '"');
            app.system('"' + scriptPath + '"');
        }
        
        return (new File(outputPath)).exists;
        
    } catch(e) {
        return false;
    }
}

// Create Windows Google API script
function createWindowsGoogleScript(scriptPath, requestPath, outputPath) {
    var script = new File(scriptPath);
    script.open("w");
    
    script.writeln('# Google Vertex AI Imagen API Script for Windows');
    script.writeln('param([string]$RequestFile = "' + requestPath + '", [string]$OutputFile = "' + outputPath + '")');
    script.writeln('');
    script.writeln('try {');
    script.writeln('    # Read request data');
    script.writeln('    $request = @{}');
    script.writeln('    Get-Content $RequestFile | ForEach-Object {');
    script.writeln('        $parts = $_ -split ":", 2');
    script.writeln('        if ($parts.Length -eq 2) {');
    script.writeln('            $request[$parts[0]] = $parts[1]');
    script.writeln('        }');
    script.writeln('    }');
    script.writeln('    ');
    script.writeln('    # Read and encode image');
    script.writeln('    $imageBytes = [System.IO.File]::ReadAllBytes($request.imagePath)');
    script.writeln('    $imageBase64 = [System.Convert]::ToBase64String($imageBytes)');
    script.writeln('    ');
    script.writeln('    # Prepare Vertex AI request');
    script.writeln('    $body = @{');
    script.writeln('        instances = @(');
    script.writeln('            @{');
    script.writeln('                prompt = $request.prompt');
    script.writeln('                image = @{');
    script.writeln('                    bytesBase64Encoded = $imageBase64');
    script.writeln('                }');
    script.writeln('                parameters = @{');
    script.writeln('                    guidance_scale = [double]$request.guidanceScale');
    script.writeln('                    number_of_inference_steps = [int]$request.steps');
    script.writeln('                    edit_mode = $request.editMode');
    script.writeln('                }');
    script.writeln('            }');
    script.writeln('        )');
    script.writeln('    } | ConvertTo-Json -Depth 10');
    script.writeln('    ');
    script.writeln('    # Set up headers');
    script.writeln('    $headers = @{');
    script.writeln('        "Authorization" = "Bearer $($request.apiKey)"');
    script.writeln('        "Content-Type" = "application/json"');
    script.writeln('    }');
    script.writeln('    ');
    script.writeln('    # Make API call');
    script.writeln('    $response = Invoke-RestMethod -Uri $request.endpoint -Method Post -Headers $headers -Body $body');
    script.writeln('    ');
    script.writeln('    # Extract and save result image');
    script.writeln('    if ($response.predictions -and $response.predictions[0].bytesBase64Encoded) {');
    script.writeln('        $resultBytes = [Convert]::FromBase64String($response.predictions[0].bytesBase64Encoded)');
    script.writeln('        [IO.File]::WriteAllBytes($OutputFile, $resultBytes)');
    script.writeln('    } else {');
    script.writeln('        throw "No image data in API response"');
    script.writeln('    }');
    script.writeln('    ');
    script.writeln('} catch {');
    script.writeln('    $_.Exception.Message | Out-File -FilePath ($OutputFile + ".error")');
    script.writeln('}');
    
    script.close();
}

// Create Mac Google API script  
function createMacGoogleScript(scriptPath, requestPath, outputPath) {
    var script = new File(scriptPath);
    script.open("w");
    
    script.writeln('#!/bin/bash');
    script.writeln('');
    script.writeln('# Google Vertex AI Imagen API Script for macOS');
    script.writeln('');
    script.writeln('REQUEST_FILE="' + requestPath + '"');
    script.writeln('OUTPUT_FILE="' + outputPath + '"');
    script.writeln('');
    script.writeln('# Read request data');
    script.writeln('declare -A request');
    script.writeln('while IFS=: read -r key value; do');
    script.writeln('    request["$key"]="$value"');
    script.writeln('done < "$REQUEST_FILE"');
    script.writeln('');
    script.writeln('# Encode image');
    script.writeln('IMAGE_BASE64=$(base64 -i "${request[imagePath]}" | tr -d "\\n")');
    script.writeln('');
    script.writeln('# Create JSON payload');
    script.writeln('PAYLOAD=$(cat <<EOF');
    script.writeln('{');
    script.writeln('  "instances": [{');
    script.writeln('    "prompt": "${request[prompt]}",');
    script.writeln('    "image": {');
    script.writeln('      "bytesBase64Encoded": "$IMAGE_BASE64"');
    script.writeln('    },');
    script.writeln('    "parameters": {');
    script.writeln('      "guidance_scale": ${request[guidanceScale]},');
    script.writeln('      "number_of_inference_steps": ${request[steps]},');
    script.writeln('      "edit_mode": "${request[editMode]}"');
    script.writeln('    }');
    script.writeln('  }]');
    script.writeln('}');
    script.writeln('EOF');
    script.writeln(')');
    script.writeln('');
    script.writeln('# Make API call');
    script.writeln('RESPONSE=$(curl -s -X POST \\');
    script.writeln('  -H "Authorization: Bearer ${request[apiKey]}" \\');
    script.writeln('  -H "Content-Type: application/json" \\');
    script.writeln('  -d "$PAYLOAD" \\');
    script.writeln('  "${request[endpoint]}")');
    script.writeln('');
    script.writeln('# Extract and decode result');
    script.writeln('echo "$RESPONSE" | python3 -c "');
    script.writeln('import sys, json, base64');
    script.writeln('try:');
    script.writeln('    data = json.load(sys.stdin)');
    script.writeln('    if \"predictions\" in data and data[\"predictions\"]:');
    script.writeln('        image_data = data[\"predictions\"][0][\"bytesBase64Encoded\"]');
    script.writeln('        with open(\"' + outputPath + '\", \"wb\") as f:');
    script.writeln('            f.write(base64.b64decode(image_data))');
    script.writeln('    else:');
    script.writeln('        print(\"No image data in response\", file=sys.stderr)');
    script.writeln('except Exception as e:');
    script.writeln('    print(f\"Error: {e}\", file=sys.stderr)');
    script.writeln('" 2>"' + outputPath + '.error"');
    
    script.close();
}

// Helper functions
function writeRequestFile(file, data) {
    file.open("w");
    for (var key in data) {
        file.writeln(key + ":" + data[key]);
    }
    file.close();
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
        
        var file = new File(TEMP_FOLDER + "input_" + Date.now() + ".png");
        var pngOptions = new PNGSaveOptions();
        
        exportDoc.saveAs(file, pngOptions, true);
        
        if (exportDoc != doc) {
            exportDoc.close(SaveOptions.DONOTSAVECHANGES);
        }
        
        return file.fsName;
        
    } catch(e) {
        return null;
    }
}

function importGoogleResult(resultPath, options) {
    try {
        var doc = app.activeDocument;
        var resultFile = new File(resultPath);
        
        var resultDoc = app.open(resultFile);
        resultDoc.selection.selectAll();
        resultDoc.selection.copy();
        resultDoc.close(SaveOptions.DONOTSAVECHANGES);
        
        app.activeDocument = doc;
        
        if (options.createNewLayer) {
            var layer = doc.paste();
            layer.name = "Google Imagen - " + new Date().toLocaleTimeString();
        } else {
            doc.paste();
        }
        
    } catch(e) {
        alert("Import error: " + e.message);
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

// Settings management
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
                } else if (line.indexOf("projectId:") == 0) {
                    settings.projectId = line.substring(10).replace(/^\s+|\s+$/g, "");
                } else if (line.indexOf("selectedModel:") == 0) {
                    settings.selectedModel = line.substring(14).replace(/^\s+|\s+$/g, "");
                } else if (line.indexOf("lastPrompt:") == 0) {
                    settings.lastPrompt = line.substring(11).replace(/^\s+|\s+$/g, "");
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
        file.writeln("projectId:" + settings.projectId);
        file.writeln("selectedModel:" + settings.selectedModel);
        file.writeln("lastPrompt:" + settings.lastPrompt);
        file.writeln("authMethod:" + settings.authMethod);
        file.writeln("temperature:" + settings.temperature);
        
        file.close();
    } catch(e) {}
}

// Run
main();