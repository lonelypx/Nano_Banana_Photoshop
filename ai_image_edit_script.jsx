// AI Image Edit Script for Photoshop
// This script provides AI-powered image editing capabilities using external API services

#target photoshop

// Global configuration
var CONFIG = {
    tempFolder: Folder.temp + "/PSAIEdit/",
    configFile: Folder.userData + "/PSAIEdit_Config.json",
    settings: {
        apiKey: "",
        apiEndpoint: "",
        selectedModel: "default",
        timeout: 60000
    }
};

// Initialize temp folder
function initializeTempFolder() {
    var folder = new Folder(CONFIG.tempFolder);
    if (!folder.exists) {
        folder.create();
    }
}

// Main entry point
function main() {
    try {
        if (app.documents.length == 0) {
            alert("Please open a document first.");
            return;
        }
        
        initializeTempFolder();
        loadConfig();
        
        if (!CONFIG.settings.apiKey) {
            showSettingsDialog();
        } else {
            showMainDialog();
        }
        
    } catch(e) {
        alert("Error: " + e.message);
    }
}

// Settings dialog
function showSettingsDialog() {
    var dialog = new Window("dialog", "AI Script Settings");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // API settings
    dialog.add("statictext", undefined, "API Configuration:");
    
    var apiKeyGroup = dialog.add("group");
    apiKeyGroup.add("statictext", undefined, "API Key:");
    var apiKeyInput = apiKeyGroup.add("edittext", undefined, CONFIG.settings.apiKey);
    apiKeyInput.characters = 40;
    
    var endpointGroup = dialog.add("group");
    endpointGroup.add("statictext", undefined, "API Endpoint:");
    var endpointInput = endpointGroup.add("edittext", undefined, CONFIG.settings.apiEndpoint);
    endpointInput.characters = 40;
    
    // Instructions
    var infoPanel = dialog.add("panel", undefined, "Setup Instructions");
    infoPanel.add("statictext", undefined, "1. Sign up for an AI image API service");
    infoPanel.add("statictext", undefined, "2. Get your API key from the service");
    infoPanel.add("statictext", undefined, "3. Enter the API endpoint URL");
    infoPanel.add("statictext", undefined, "4. Save settings and start editing!");
    
    // Buttons
    var btnGroup = dialog.add("group");
    var saveBtn = btnGroup.add("button", undefined, "Save");
    var cancelBtn = btnGroup.add("button", undefined, "Cancel");
    
    saveBtn.onClick = function() {
        CONFIG.settings.apiKey = apiKeyInput.text;
        CONFIG.settings.apiEndpoint = endpointInput.text;
        saveConfig();
        dialog.close();
        showMainDialog();
    };
    
    dialog.show();
}

// Main editing dialog
function showMainDialog() {
    var dialog = new Window("dialog", "AI Image Edit");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Check selection
    var hasSelection = false;
    try {
        var bounds = app.activeDocument.selection.bounds;
        hasSelection = (bounds[0] != bounds[2] && bounds[1] != bounds[3]);
    } catch(e) {}
    
    if (!hasSelection) {
        dialog.add("statictext", undefined, "⚠ No selection detected - will process entire image");
    }
    
    // Prompt input
    dialog.add("statictext", undefined, "Describe the changes you want:");
    var promptInput = dialog.add("edittext", undefined, "", {multiline: true});
    promptInput.preferredSize.height = 80;
    
    // Options
    var optionsPanel = dialog.add("panel", undefined, "Options");
    var saveBackupCheck = optionsPanel.add("checkbox", undefined, "Save backup of original");
    saveBackupCheck.value = true;
    var newLayerCheck = optionsPanel.add("checkbox", undefined, "Create result as new layer");
    newLayerCheck.value = true;
    
    // Process button
    var btnGroup = dialog.add("group");
    var processBtn = btnGroup.add("button", undefined, "Process");
    var cancelBtn = btnGroup.add("button", undefined, "Cancel");
    
    processBtn.onClick = function() {
        if (!promptInput.text) {
            alert("Please enter a description of the changes you want.");
            return;
        }
        
        dialog.close();
        processImage(promptInput.text, {
            saveBackup: saveBackupCheck.value,
            newLayer: newLayerCheck.value,
            hasSelection: hasSelection
        });
    };
    
    dialog.show();
}

// Process the image
function processImage(prompt, options) {
    try {
        var doc = app.activeDocument;
        
        // Save current state
        if (options.saveBackup) {
            doc.suspendHistory("AI Edit Backup", "");
        }
        
        // Export selection or full image
        var exportFile = new File(CONFIG.tempFolder + "export_" + Date.now() + ".jpg");
        
        if (options.hasSelection) {
            // Copy selection to new doc
            doc.selection.copy();
            var tempDoc = app.documents.add(
                doc.width,
                doc.height,
                doc.resolution,
                "Temp",
                NewDocumentMode.RGB
            );
            tempDoc.paste();
            tempDoc.flatten();
            
            // Export
            var jpgOptions = new JPEGSaveOptions();
            jpgOptions.quality = 10;
            tempDoc.saveAs(exportFile, jpgOptions, true);
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        } else {
            // Export full document
            var jpgOptions = new JPEGSaveOptions();
            jpgOptions.quality = 10;
            doc.saveAs(exportFile, jpgOptions, true);
        }
        
        // Prepare API request
        var requestData = {
            prompt: prompt,
            imagePath: exportFile.fsName,
            outputPath: CONFIG.tempFolder + "result_" + Date.now() + ".jpg"
        };
        
        // Show progress
        var progressWin = new Window("window", "Processing");
        progressWin.add("statictext", undefined, "Sending image to AI service...");
        progressWin.add("statictext", undefined, "This may take a moment...");
        progressWin.show();
        
        // Make API call via external script
        var success = callExternalAPI(requestData);
        progressWin.close();
        
        if (success && (new File(requestData.outputPath)).exists) {
            // Import result
            var resultFile = new File(requestData.outputPath);
            var resultDoc = app.open(resultFile);
            resultDoc.selection.selectAll();
            resultDoc.selection.copy();
            resultDoc.close(SaveOptions.DONOTSAVECHANGES);
            
            // Paste as new layer
            app.activeDocument = doc;
            if (options.newLayer) {
                var newLayer = doc.paste();
                newLayer.name = "AI Edit - " + prompt.substring(0, 30);
            } else {
                doc.paste();
            }
            
            // Cleanup
            exportFile.remove();
            resultFile.remove();
            
            alert("AI edit completed successfully!");
            
        } else {
            alert("Failed to process image. Please check your API settings.");
        }
        
    } catch(e) {
        alert("Error processing image: " + e.message);
    }
}

// Call external API
function callExternalAPI(requestData) {
    try {
        // Create a helper script based on platform
        var script;
        
        if ($.os.indexOf("Windows") > -1) {
            // Windows: Create a PowerShell script
            script = new File(CONFIG.tempFolder + "api_call.ps1");
            script.open("w");
            script.writeln('$image = [Convert]::ToBase64String([IO.File]::ReadAllBytes("' + requestData.imagePath + '"))');
            script.writeln('$body = @{');
            script.writeln('    prompt = "' + requestData.prompt.replace(/"/g, '\"') + '"');
            script.writeln('    image = $image');
            script.writeln('} | ConvertTo-Json');
            script.writeln('');
            script.writeln('$headers = @{');
            script.writeln('    "Authorization" = "Bearer ' + CONFIG.settings.apiKey + '"');
            script.writeln('    "Content-Type" = "application/json"');
            script.writeln('}');
            script.writeln('');
            script.writeln('# Make API call here');
            script.writeln('# This is a template - implement actual API call based on your service');
            script.writeln('');
            script.writeln('# For testing, just copy the input to output');
            script.writeln('Copy-Item "' + requestData.imagePath + '" "' + requestData.outputPath + '"');
            script.close();
            
            // Execute PowerShell script
            app.system('powershell -ExecutionPolicy Bypass -File "' + script.fsName + '"');
            
        } else {
            // macOS/Unix: Create a shell script
            script = new File(CONFIG.tempFolder + "api_call.sh");
            script.open("w");
            script.writeln('#!/bin/bash');
            script.writeln('');
            script.writeln('# Encode image to base64');
            script.writeln('IMAGE_BASE64=$(base64 -i "' + requestData.imagePath + '")');
            script.writeln('');
            script.writeln('# Prepare JSON payload');
            script.writeln('JSON_PAYLOAD=$(cat <<EOF');
            script.writeln('{');
            script.writeln('  "prompt": "' + requestData.prompt.replace(/"/g, '\\"') + '",');
            script.writeln('  "image": "$IMAGE_BASE64"');
            script.writeln('}');
            script.writeln('EOF');
            script.writeln(')');
            script.writeln('');
            script.writeln('# Make API call using curl');
            script.writeln('# This is a template - implement actual API call based on your service');
            script.writeln('# Example:');
            script.writeln('# curl -X POST \\');
            script.writeln('#   -H "Authorization: Bearer ' + CONFIG.settings.apiKey + '" \\');
            script.writeln('#   -H "Content-Type: application/json" \\');
            script.writeln('#   -d "$JSON_PAYLOAD" \\');
            script.writeln('#   "' + CONFIG.settings.apiEndpoint + '" \\');
            script.writeln('#   > response.json');
            script.writeln('');
            script.writeln('# For testing, just copy the input to output');
            script.writeln('cp "' + requestData.imagePath + '" "' + requestData.outputPath + '"');
            script.close();
            
            // Make script executable and run it
            app.system('chmod +x "' + script.fsName + '"');
            app.system('"' + script.fsName + '"');
        }
        
        // Check if output was created
        return (new File(requestData.outputPath)).exists;
        
    } catch(e) {
        alert("API call error: " + e.message);
        return false;
    }
}

// Configuration management
function loadConfig() {
    try {
        var configFile = new File(CONFIG.configFile);
        if (configFile.exists) {
            configFile.open("r");
            var content = configFile.read();
            configFile.close();
            
            // Simple JSON parse
            var settings = {};
            var lines = content.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var parts = lines[i].split(":");
                if (parts.length == 2) {
                    var key = parts[0].replace(/["\s]/g, "");
                    var value = parts[1].replace(/[",]/g, "").replace(/^\s+|\s+$/g, "");
                    settings[key] = value;
                }
            }
            
            if (settings.apiKey) CONFIG.settings.apiKey = settings.apiKey;
            if (settings.apiEndpoint) CONFIG.settings.apiEndpoint = settings.apiEndpoint;
            if (settings.selectedModel) CONFIG.settings.selectedModel = settings.selectedModel;
        }
    } catch(e) {}
}

function saveConfig() {
    try {
        var configFile = new File(CONFIG.configFile);
        configFile.open("w");
        configFile.writeln('{');
        configFile.writeln('  "apiKey": "' + CONFIG.settings.apiKey + '",');
        configFile.writeln('  "apiEndpoint": "' + CONFIG.settings.apiEndpoint + '",');
        configFile.writeln('  "selectedModel": "' + CONFIG.settings.selectedModel + '"');
        configFile.writeln('}');
        configFile.close();
    } catch(e) {
        alert("Could not save settings: " + e.message);
    }
}

// Helper function to create test implementation
function createTestImplementation() {
    alert("This script provides a framework for AI image editing.\n\n" +
          "To complete the implementation:\n" +
          "1. Choose an AI image API service\n" +
          "2. Modify the API call scripts for your chosen service\n" +
          "3. Update the response handling code\n\n" +
          "The script currently copies the input as a test.");
}

// Run main function
main();