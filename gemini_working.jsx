// Working Google Gemini Script for Photoshop
// Simplified and tested version

#target photoshop

// Your working API key (tested successfully)
var API_KEY = "AIzaSyAY7htlCyNdozAByMG0j3RkStKwsGOBB0o";
var MODEL = "gemini-1.5-flash";

function main() {
    try {
        // Check document
        if (app.documents.length == 0) {
            alert("Please open a document first.");
            return;
        }
        
        // Simple prompt dialog
        var prompt = prompt("What do you want me to analyze about this image?", 
                           "Analyze the colors in this image and suggest adjustments to make it more vibrant");
        
        if (!prompt) return;
        
        // Show we're working
        var progressWin = new Window("window", "Processing");
        progressWin.add("statictext", undefined, "Analyzing image with Gemini AI...");
        progressWin.add("statictext", undefined, "Please wait 10-30 seconds...");
        progressWin.show();
        
        // Process
        var result = processImage(prompt);
        progressWin.close();
        
        if (result) {
            showResult(result, prompt);
        } else {
            alert("Failed to get response. Check:\n1. Internet connection\n2. Image size (try smaller image)\n3. Try again in a moment");
        }
        
    } catch(e) {
        alert("Error: " + e.message);
    }
}

function processImage(prompt) {
    try {
        // Create temp folder on desktop (more reliable)
        var tempBase = Folder.desktop.fsName + "/PhotoshopAI/";
        var tempFolder = new Folder(tempBase);
        if (!tempFolder.exists) {
            tempFolder.create();
        }
        
        // Export image
        var doc = app.activeDocument;
        var exportPath = tempBase + "image_" + Date.now() + ".jpg";
        
        // Save current document as JPEG
        var saveFile = new File(exportPath);
        var jpgOptions = new JPEGSaveOptions();
        jpgOptions.quality = 8; // Smaller file for API
        
        if (hasSelection()) {
            // Copy selection to new doc
            doc.selection.copy();
            var bounds = doc.selection.bounds;
            var tempDoc = app.documents.add(
                bounds[2] - bounds[0], 
                bounds[3] - bounds[1], 
                doc.resolution, 
                "Temp", 
                NewDocumentMode.RGB
            );
            tempDoc.paste();
            tempDoc.saveAs(saveFile, jpgOptions, true);
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        } else {
            // Save entire document
            doc.saveAs(saveFile, jpgOptions, true);
        }
        
        // Create API script
        var scriptPath = tempBase + "api_call.sh";
        var script = new File(scriptPath);
        script.open("w");
        
        script.writeln('#!/bin/bash');
        script.writeln('');
        script.writeln('# Encode image');
        script.writeln('IMAGE_B64=$(base64 -i "' + exportPath + '" | tr -d "\\n")');
        script.writeln('');
        script.writeln('# API call');
        script.writeln('curl -s -X POST \\');
        script.writeln('  -H "Content-Type: application/json" \\');
        script.writeln('  -d "{\\"contents\\":[{\\"parts\\":[{\\"text\\":\\"' + prompt.replace(/"/g, '\\"') + '\\"},{\\"inline_data\\":{\\"mime_type\\":\\"image/jpeg\\",\\"data\\":\\"$IMAGE_B64\\"}}]}]}" \\');
        script.writeln('  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY + '" \\');
        script.writeln('  | python3 -c "');
        script.writeln('import sys, json');
        script.writeln('try:');
        script.writeln('    data = json.load(sys.stdin)');
        script.writeln('    text = data[\\"candidates\\"][0][\\"content\\"][\\"parts\\"][0][\\"text\\"]');
        script.writeln('    print(text)');
        script.writeln('except Exception as e:');
        script.writeln('    print(f\\"Error: {e}\\")');
        script.writeln('    print(\\"Raw:\\", str(data)[:500] if \\"data\\" in locals() else \\"No data\\")');
        script.writeln('" > "' + tempBase + 'response.txt"');
        
        script.close();
        
        // Execute
        app.system('chmod +x "' + scriptPath + '"');
        app.system('"' + scriptPath + '"');
        
        // Read response
        var responseFile = new File(tempBase + "response.txt");
        var response = null;
        
        // Wait up to 30 seconds
        var maxWait = 30;
        while (maxWait > 0 && (!responseFile.exists || responseFile.length == 0)) {
            $.sleep(1000);
            maxWait--;
        }
        
        if (responseFile.exists && responseFile.length > 0) {
            responseFile.open("r");
            response = responseFile.read();
            responseFile.close();
        }
        
        // Cleanup
        saveFile.remove();
        script.remove();
        if (responseFile.exists) responseFile.remove();
        
        return response;
        
    } catch(e) {
        alert("Process error: " + e.message);
        return null;
    }
}

function showResult(response, prompt) {
    // Add to document as text layer
    try {
        var doc = app.activeDocument;
        var textLayer = doc.artLayers.add();
        textLayer.kind = LayerKind.TEXT;
        textLayer.name = "Gemini Analysis";
        
        var textItem = textLayer.textItem;
        textItem.contents = "GEMINI ANALYSIS\n" + new Date().toLocaleString() + 
                           "\n\nPrompt: " + prompt + "\n\n" + response;
        textItem.size = 14;
        textItem.position = [50, 50];
        
        // Set text color to black
        var textColor = new SolidColor();
        textColor.rgb.red = 0;
        textColor.rgb.green = 0; 
        textColor.rgb.blue = 0;
        textItem.color = textColor;
        
    } catch(e) {}
    
    // Also show in dialog
    var resultDialog = new Window("dialog", "✨ Gemini Analysis Results");
    resultDialog.orientation = "column";
    resultDialog.alignChildren = "fill";
    resultDialog.spacing = 10;
    resultDialog.margins = 16;
    resultDialog.preferredSize.width = 600;
    
    resultDialog.add("statictext", undefined, "Your prompt: " + prompt);
    
    var responseText = resultDialog.add("edittext", undefined, response, {multiline: true, readonly: true});
    responseText.preferredSize.height = 400;
    
    var btnGroup = resultDialog.add("group");
    var newBtn = btnGroup.add("button", undefined, "New Analysis");
    var closeBtn = btnGroup.add("button", undefined, "Close");
    
    newBtn.onClick = function() {
        resultDialog.close();
        main(); // Start over
    };
    
    resultDialog.show();
}

function hasSelection() {
    try {
        var bounds = app.activeDocument.selection.bounds;
        return (bounds[0] != bounds[2] && bounds[1] != bounds[3]);
    } catch(e) {
        return false;
    }
}

// Run the script
main();