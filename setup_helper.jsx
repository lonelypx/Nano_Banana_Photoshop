// Setup Helper for AI Image Edit Script
// This script helps set up the necessary helper files for API integration

#target photoshop

function setupHelperScripts() {
    var baseFolder = Folder.temp + "/PSAIEdit/";
    var folder = new Folder(baseFolder);
    
    if (!folder.exists) {
        folder.create();
    }
    
    // Create platform-specific helper scripts
    if ($.os.indexOf("Windows") > -1) {
        createWindowsHelper(baseFolder);
    } else {
        createMacHelper(baseFolder);
    }
    
    alert("Helper scripts created in:\n" + baseFolder + "\n\nYou can now use the AI Image Edit script!");
}

function createWindowsHelper(baseFolder) {
    // Create a more complete PowerShell helper
    var helperFile = new File(baseFolder + "ai_process.ps1");
    helperFile.open("w");
    
    helperFile.writeln('param(');
    helperFile.writeln('    [string]$ImagePath,');
    helperFile.writeln('    [string]$OutputPath,');
    helperFile.writeln('    [string]$Prompt,');
    helperFile.writeln('    [string]$ApiKey,');
    helperFile.writeln('    [string]$ApiEndpoint');
    helperFile.writeln(')');
    helperFile.writeln('');
    helperFile.writeln('# Function to call Replicate-style API');
    helperFile.writeln('function Invoke-ReplicateAPI {');
    helperFile.writeln('    param($ImagePath, $Prompt, $ApiKey, $Model)');
    helperFile.writeln('    ');
    helperFile.writeln('    # Convert image to base64');
    helperFile.writeln('    $imageBytes = [System.IO.File]::ReadAllBytes($ImagePath)');
    helperFile.writeln('    $imageBase64 = [System.Convert]::ToBase64String($imageBytes)');
    helperFile.writeln('    $imageDataUri = "data:image/jpeg;base64,$imageBase64"');
    helperFile.writeln('    ');
    helperFile.writeln('    # Create prediction');
    helperFile.writeln('    $body = @{');
    helperFile.writeln('        version = $Model');
    helperFile.writeln('        input = @{');
    helperFile.writeln('            image = $imageDataUri');
    helperFile.writeln('            prompt = $Prompt');
    helperFile.writeln('        }');
    helperFile.writeln('    } | ConvertTo-Json -Depth 10');
    helperFile.writeln('    ');
    helperFile.writeln('    $headers = @{');
    helperFile.writeln('        "Authorization" = "Token $ApiKey"');
    helperFile.writeln('        "Content-Type" = "application/json"');
    helperFile.writeln('    }');
    helperFile.writeln('    ');
    helperFile.writeln('    try {');
    helperFile.writeln('        # Create prediction');
    helperFile.writeln('        $response = Invoke-RestMethod -Uri "https://api.replicate.com/v1/predictions" -Method Post -Headers $headers -Body $body');
    helperFile.writeln('        $predictionId = $response.id');
    helperFile.writeln('        ');
    helperFile.writeln('        # Poll for result');
    helperFile.writeln('        $status = "starting"');
    helperFile.writeln('        while ($status -eq "starting" -or $status -eq "processing") {');
    helperFile.writeln('            Start-Sleep -Seconds 2');
    helperFile.writeln('            $result = Invoke-RestMethod -Uri "https://api.replicate.com/v1/predictions/$predictionId" -Headers $headers');
    helperFile.writeln('            $status = $result.status');
    helperFile.writeln('        }');
    helperFile.writeln('        ');
    helperFile.writeln('        if ($status -eq "succeeded" -and $result.output) {');
    helperFile.writeln('            # Download result image');
    helperFile.writeln('            $imageUrl = $result.output[0]');
    helperFile.writeln('            Invoke-WebRequest -Uri $imageUrl -OutFile $OutputPath');
    helperFile.writeln('            return $true');
    helperFile.writeln('        }');
    helperFile.writeln('    } catch {');
    helperFile.writeln('        Write-Error $_.Exception.Message');
    helperFile.writeln('    }');
    helperFile.writeln('    return $false');
    helperFile.writeln('}');
    helperFile.writeln('');
    helperFile.writeln('# Function for OpenAI-style API');
    helperFile.writeln('function Invoke-OpenAIStyleAPI {');
    helperFile.writeln('    param($ImagePath, $Prompt, $ApiKey, $Endpoint)');
    helperFile.writeln('    ');
    helperFile.writeln('    $imageBytes = [System.IO.File]::ReadAllBytes($ImagePath)');
    helperFile.writeln('    $imageBase64 = [System.Convert]::ToBase64String($imageBytes)');
    helperFile.writeln('    ');
    helperFile.writeln('    $body = @{');
    helperFile.writeln('        model = "dall-e-2"');
    helperFile.writeln('        prompt = $Prompt');
    helperFile.writeln('        image = $imageBase64');
    helperFile.writeln('        n = 1');
    helperFile.writeln('        size = "1024x1024"');
    helperFile.writeln('    } | ConvertTo-Json');
    helperFile.writeln('    ');
    helperFile.writeln('    $headers = @{');
    helperFile.writeln('        "Authorization" = "Bearer $ApiKey"');
    helperFile.writeln('        "Content-Type" = "application/json"');
    helperFile.writeln('    }');
    helperFile.writeln('    ');
    helperFile.writeln('    try {');
    helperFile.writeln('        $response = Invoke-RestMethod -Uri $Endpoint -Method Post -Headers $headers -Body $body');
    helperFile.writeln('        if ($response.data -and $response.data[0].url) {');
    helperFile.writeln('            Invoke-WebRequest -Uri $response.data[0].url -OutFile $OutputPath');
    helperFile.writeln('            return $true');
    helperFile.writeln('        }');
    helperFile.writeln('    } catch {');
    helperFile.writeln('        Write-Error $_.Exception.Message');
    helperFile.writeln('    }');
    helperFile.writeln('    return $false');
    helperFile.writeln('}');
    helperFile.writeln('');
    helperFile.writeln('# Main execution');
    helperFile.writeln('if (Test-Path $ImagePath) {');
    helperFile.writeln('    # For testing, just apply a simple filter');
    helperFile.writeln('    # In production, call the appropriate API');
    helperFile.writeln('    ');
    helperFile.writeln('    # Example: Invoke-ReplicateAPI -ImagePath $ImagePath -Prompt $Prompt -ApiKey $ApiKey -Model "model-id"');
    helperFile.writeln('    # Example: Invoke-OpenAIStyleAPI -ImagePath $ImagePath -Prompt $Prompt -ApiKey $ApiKey -Endpoint $ApiEndpoint');
    helperFile.writeln('    ');
    helperFile.writeln('    # For now, create a modified copy');
    helperFile.writeln('    Add-Type -AssemblyName System.Drawing');
    helperFile.writeln('    $image = [System.Drawing.Image]::FromFile($ImagePath)');
    helperFile.writeln('    $graphics = [System.Drawing.Graphics]::FromImage($image)');
    helperFile.writeln('    $font = New-Object System.Drawing.Font("Arial", 20)');
    helperFile.writeln('    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Red)');
    helperFile.writeln('    $graphics.DrawString("AI Processed: $Prompt", $font, $brush, 10, 10)');
    helperFile.writeln('    $image.Save($OutputPath)');
    helperFile.writeln('    $graphics.Dispose()');
    helperFile.writeln('    $image.Dispose()');
    helperFile.writeln('}');
    
    helperFile.close();
}

function createMacHelper(baseFolder) {
    // Create a shell script helper for macOS
    var helperFile = new File(baseFolder + "ai_process.sh");
    helperFile.open("w");
    
    helperFile.writeln('#!/bin/bash');
    helperFile.writeln('');
    helperFile.writeln('# AI Image Processing Helper Script');
    helperFile.writeln('# Usage: ./ai_process.sh <image_path> <output_path> <prompt> <api_key> <api_endpoint>');
    helperFile.writeln('');
    helperFile.writeln('IMAGE_PATH="$1"');
    helperFile.writeln('OUTPUT_PATH="$2"');
    helperFile.writeln('PROMPT="$3"');
    helperFile.writeln('API_KEY="$4"');
    helperFile.writeln('API_ENDPOINT="$5"');
    helperFile.writeln('');
    helperFile.writeln('# Function for Replicate-style API');
    helperFile.writeln('call_replicate_api() {');
    helperFile.writeln('    local MODEL="$1"');
    helperFile.writeln('    ');
    helperFile.writeln('    # Convert image to base64');
    helperFile.writeln('    IMAGE_BASE64=$(base64 -i "$IMAGE_PATH" | tr -d "\\n")');
    helperFile.writeln('    IMAGE_DATA_URI="data:image/jpeg;base64,$IMAGE_BASE64"');
    helperFile.writeln('    ');
    helperFile.writeln('    # Create prediction');
    helperFile.writeln('    RESPONSE=$(curl -s -X POST \\');
    helperFile.writeln('        -H "Authorization: Token $API_KEY" \\');
    helperFile.writeln('        -H "Content-Type: application/json" \\');
    helperFile.writeln('        -d "{');
    helperFile.writeln('            \\"version\\": \\"$MODEL\\",');
    helperFile.writeln('            \\"input\\": {');
    helperFile.writeln('                \\"image\\": \\"$IMAGE_DATA_URI\\",');
    helperFile.writeln('                \\"prompt\\": \\"$PROMPT\\"');
    helperFile.writeln('            }');
    helperFile.writeln('        }" \\');
    helperFile.writeln('        https://api.replicate.com/v1/predictions)');
    helperFile.writeln('    ');
    helperFile.writeln('    # Extract prediction ID');
    helperFile.writeln('    PREDICTION_ID=$(echo "$RESPONSE" | grep -o \'"id":"[^"]*"\' | cut -d\'"\' -f4)');
    helperFile.writeln('    ');
    helperFile.writeln('    if [ -z "$PREDICTION_ID" ]; then');
    helperFile.writeln('        echo "Failed to create prediction"');
    helperFile.writeln('        return 1');
    helperFile.writeln('    fi');
    helperFile.writeln('    ');
    helperFile.writeln('    # Poll for result');
    helperFile.writeln('    STATUS="starting"');
    helperFile.writeln('    while [ "$STATUS" = "starting" ] || [ "$STATUS" = "processing" ]; do');
    helperFile.writeln('        sleep 2');
    helperFile.writeln('        RESULT=$(curl -s -H "Authorization: Token $API_KEY" \\');
    helperFile.writeln('            "https://api.replicate.com/v1/predictions/$PREDICTION_ID")');
    helperFile.writeln('        STATUS=$(echo "$RESULT" | grep -o \'"status":"[^"]*"\' | cut -d\'"\' -f4)');
    helperFile.writeln('    done');
    helperFile.writeln('    ');
    helperFile.writeln('    if [ "$STATUS" = "succeeded" ]; then');
    helperFile.writeln('        # Extract output URL and download');
    helperFile.writeln('        OUTPUT_URL=$(echo "$RESULT" | grep -o \'"output":\\["[^"]*"\\]\' | cut -d\'"\' -f4)');
    helperFile.writeln('        if [ ! -z "$OUTPUT_URL" ]; then');
    helperFile.writeln('            curl -s -o "$OUTPUT_PATH" "$OUTPUT_URL"');
    helperFile.writeln('            return 0');
    helperFile.writeln('        fi');
    helperFile.writeln('    fi');
    helperFile.writeln('    ');
    helperFile.writeln('    return 1');
    helperFile.writeln('}');
    helperFile.writeln('');
    helperFile.writeln('# Function for OpenAI-style API');
    helperFile.writeln('call_openai_style_api() {');
    helperFile.writeln('    IMAGE_BASE64=$(base64 -i "$IMAGE_PATH" | tr -d "\\n")');
    helperFile.writeln('    ');
    helperFile.writeln('    RESPONSE=$(curl -s -X POST \\');
    helperFile.writeln('        -H "Authorization: Bearer $API_KEY" \\');
    helperFile.writeln('        -H "Content-Type: application/json" \\');
    helperFile.writeln('        -d "{');
    helperFile.writeln('            \\"model\\": \\"image-edit\\",');
    helperFile.writeln('            \\"prompt\\": \\"$PROMPT\\",');
    helperFile.writeln('            \\"image\\": \\"$IMAGE_BASE64\\",');
    helperFile.writeln('            \\"n\\": 1');
    helperFile.writeln('        }" \\');
    helperFile.writeln('        "$API_ENDPOINT")');
    helperFile.writeln('    ');
    helperFile.writeln('    # Extract result URL');
    helperFile.writeln('    RESULT_URL=$(echo "$RESPONSE" | grep -o \'"url":"[^"]*"\' | cut -d\'"\' -f4 | head -1)');
    helperFile.writeln('    ');
    helperFile.writeln('    if [ ! -z "$RESULT_URL" ]; then');
    helperFile.writeln('        curl -s -o "$OUTPUT_PATH" "$RESULT_URL"');
    helperFile.writeln('        return 0');
    helperFile.writeln('    fi');
    helperFile.writeln('    ');
    helperFile.writeln('    return 1');
    helperFile.writeln('}');
    helperFile.writeln('');
    helperFile.writeln('# Main execution');
    helperFile.writeln('if [ -f "$IMAGE_PATH" ]; then');
    helperFile.writeln('    # For testing, create a watermarked copy using ImageMagick if available');
    helperFile.writeln('    if command -v convert &> /dev/null; then');
    helperFile.writeln('        convert "$IMAGE_PATH" \\');
    helperFile.writeln('            -pointsize 40 \\');
    helperFile.writeln('            -fill red \\');
    helperFile.writeln('            -gravity northwest \\');
    helperFile.writeln('            -annotate +10+10 "AI: $PROMPT" \\');
    helperFile.writeln('            "$OUTPUT_PATH"');
    helperFile.writeln('    else');
    helperFile.writeln('        # Fallback: just copy the file');
    helperFile.writeln('        cp "$IMAGE_PATH" "$OUTPUT_PATH"');
    helperFile.writeln('    fi');
    helperFile.writeln('    ');
    helperFile.writeln('    # Uncomment to use actual APIs:');
    helperFile.writeln('    # call_replicate_api "model-version-id"');
    helperFile.writeln('    # call_openai_style_api');
    helperFile.writeln('fi');
    
    helperFile.close();
    
    // Make it executable
    app.system('chmod +x "' + helperFile.fsName + '"');
}

// Run setup
setupHelperScripts();