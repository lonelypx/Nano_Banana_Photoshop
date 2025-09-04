# Google Direct API Integration for Photoshop

Complete documentation for using Google's AI APIs directly in Adobe Photoshop without Replicate.com or other third-party services.

## Table of Contents

- [Overview](#overview)
- [Complete Setup Guide](#complete-setup-guide)
- [Usage Manual](#usage-manual)
- [API Models Comparison](#api-models-comparison)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)
- [Technical Details](#technical-details)

## Overview

This documentation covers three Google API integrations for Photoshop:

1. **Google Imagen API** (`google_imagen_editor.jsx`) - For actual image generation/editing
2. **Google Gemini Vision** (`google_gemini_direct.jsx`) - For comprehensive image analysis
3. **Simple Gemini** (`gemini_simple_edit.jsx`) - Quick analysis with free API

## Complete Setup Guide

### Option 1: Google AI Studio (Easiest - Free)

**Best for**: Beginners, image analysis, editing guidance

#### Step-by-Step Setup:

1. **Get Your API Key**
   - Go to [Google AI Studio](https://aistudio.google.com)
   - Sign in with your Google account
   - Click "Get API Key" in the top menu
   - Click "Create API Key"
   - Copy the generated key (starts with `AIza...`)

2. **Install the Script**
   - Copy `gemini_simple_edit.jsx` to Photoshop Scripts folder:
     - **Windows**: `C:\Program Files\Adobe\Adobe Photoshop [Version]\Presets\Scripts\`
     - **macOS**: `/Applications/Adobe Photoshop [Version]/Presets/Scripts/`

3. **First Run**
   - Open Photoshop
   - Go to `File > Scripts > gemini_simple_edit`
   - Enter your API key when prompted
   - You're ready to start!

#### What You Get:
- Free tier with generous limits
- Image analysis and editing suggestions
- Step-by-step Photoshop instructions
- Works on any Photoshop version

### Option 2: Google Cloud Platform (Advanced)

**Best for**: Professional use, actual image generation, high volume

#### Step-by-Step Setup:

1. **Create Google Cloud Project**
   ```
   1. Go to console.cloud.google.com
   2. Click "Select a project" → "New Project"
   3. Enter project name (e.g., "photoshop-ai")
   4. Note your Project ID (you'll need this)
   ```

2. **Enable Required APIs**
   ```
   1. In your project, go to "APIs & Services" → "Library"
   2. Search for "Vertex AI API"
   3. Click on it and press "Enable"
   4. Wait for enabling to complete
   ```

3. **Create API Credentials**
   
   **Method A: API Key (Simpler)**
   ```
   1. Go to "APIs & Services" → "Credentials"
   2. Click "Create Credentials" → "API Key"
   3. Copy the generated key
   4. (Optional) Click "Restrict Key" for security
   ```
   
   **Method B: Service Account (More Secure)**
   ```
   1. Go to "APIs & Services" → "Credentials"
   2. Click "Create Credentials" → "Service Account"
   3. Fill in details and create
   4. Click on the service account
   5. Go to "Keys" tab → "Add Key" → "Create New Key"
   6. Choose JSON format and download
   7. Save the JSON file securely
   ```

4. **Configure Billing**
   ```
   1. Go to "Billing" in the console
   2. Enable billing for your project
   3. Note: Google Cloud APIs require billing enabled
   ```

5. **Install and Configure Script**
   ```
   1. Copy google_imagen_editor.jsx to Scripts folder
   2. Run the script in Photoshop
   3. Enter your Project ID and API credentials
   4. Save configuration
   ```

## Usage Manual

### Using Simple Gemini (Analysis & Guidance)

#### Basic Workflow:

1. **Open an Image**
   - Open any image in Photoshop
   - Optionally make a selection for focused analysis

2. **Run the Script**
   - `File > Scripts > gemini_simple_edit`
   - Or use assigned keyboard shortcut

3. **Enter Your Request**
   - Describe what you want to analyze or change
   - Examples:
     ```
     "How can I make this photo more dramatic?"
     "What's wrong with the lighting in this image?"
     "Give me steps to remove the background"
     "How to make colors more vibrant?"
     ```

4. **Get AI Analysis**
   - Gemini analyzes your image
   - Provides detailed Photoshop instructions
   - Creates a text layer with the guidance (optional)

#### Example Prompts:

**For Analysis:**
- "Analyze the composition of this photo and suggest improvements"
- "What editing techniques would make this image more professional?"
- "Identify issues with exposure and color balance"

**For Specific Tasks:**
- "Step-by-step instructions to remove this background cleanly"
- "How to create a vintage film look on this photo"
- "Techniques to enhance the subject while keeping background natural"

**For Learning:**
- "Explain the lighting setup used in this photo"
- "What camera settings would recreate this look?"
- "How was this effect achieved in post-processing?"

### Using Google Imagen (Actual Image Generation)

#### Basic Workflow:

1. **Open and Prepare**
   - Open your image in Photoshop
   - Make a selection if you want to edit a specific area

2. **Choose Edit Mode**
   - **Inpaint**: Edit the selected area
   - **Outpaint**: Extend the image beyond current boundaries
   - **Replace**: Generate completely new content

3. **Enter Detailed Prompt**
   - Be specific about what you want
   - Mention style, mood, lighting
   - Examples:
     ```
     "Replace the sky with dramatic storm clouds"
     "Add a person walking on the left side of the path"
     "Change the lighting to golden hour with warm tones"
     ```

4. **Adjust Parameters**
   - **Guidance Scale (1-20)**: How closely to follow your prompt
     - Low (1-5): More creative freedom
     - Medium (6-10): Balanced
     - High (11-20): Strict adherence to prompt
   - **Steps (10-50)**: Quality vs speed
     - Low: Faster but lower quality
     - High: Slower but better quality

5. **Generate**
   - Click "Generate Edit"
   - Wait for processing (30-120 seconds)
   - Result imports as new layer

#### Advanced Prompting Tips:

**Style Specifications:**
- "in photorealistic style"
- "as a watercolor painting"  
- "in the style of a professional portrait"
- "with cinematic lighting"

**Technical Details:**
- "with shallow depth of field"
- "using dramatic side lighting"
- "with high contrast and vibrant colors"
- "maintaining the original perspective"

**Quality Modifiers:**
- "highly detailed"
- "8k resolution"
- "professional photography"
- "studio lighting"

## API Models Comparison

### Google AI Studio Models (Free Tier)

| Model | Best For | Features | Speed | Cost |
|-------|----------|----------|-------|------|
| **Gemini 1.5 Flash** | Quick analysis | Fast processing, image understanding | Very Fast | Free* |
| **Gemini 1.5 Pro** | Detailed analysis | High-quality responses, complex reasoning | Moderate | Free* |
| **Gemini Pro Vision** | Image analysis | Specialized for visual understanding | Fast | Free* |

*Free tier with rate limits, paid tiers available

### Google Cloud Vertex AI Models (Paid)

| Model | Best For | Features | Quality | Cost per Image |
|-------|----------|----------|---------|----------------|
| **Imagen 2.0** | General editing | Fast generation, good quality | High | ~$0.02-0.05 |
| **Imagen 3.0** | Professional work | Highest quality, text rendering | Very High | ~$0.08-0.12 |

### Feature Comparison

| Feature | Gemini (Free) | Imagen (Paid) |
|---------|---------------|---------------|
| Image Analysis | ✅ Excellent | ✅ Good |
| Editing Instructions | ✅ Detailed | ❌ No |
| Actual Image Generation | ❌ No | ✅ Yes |
| Free Tier | ✅ Yes | ❌ No |
| Setup Complexity | ⭐ Simple | ⭐⭐⭐ Complex |
| Commercial Use | ✅ Allowed | ✅ Allowed |

## Troubleshooting

### Common Setup Issues

#### "API Key Invalid" Error
**Cause**: Incorrect or expired API key
**Solutions**:
1. Verify key was copied completely (no extra spaces)
2. Check if key is from correct service (AI Studio vs Cloud Console)
3. Ensure API quotas aren't exceeded
4. Try regenerating the key

#### "Project ID Not Found"
**Cause**: Incorrect project ID or API not enabled
**Solutions**:
1. Double-check project ID in Google Cloud Console
2. Ensure Vertex AI API is enabled
3. Verify billing is enabled for the project
4. Check project permissions

#### "Network Error" / "Connection Failed"
**Causes**: Network issues or firewall blocking
**Solutions**:
1. Check internet connection
2. Try from different network
3. Check if corporate firewall blocks Google APIs
4. Verify no VPN conflicts

### Script-Specific Issues

#### Windows PowerShell Errors
**Issue**: "Execution Policy" errors
**Solution**:
```powershell
# Run once as administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### macOS Permission Errors
**Issue**: Script can't execute helper files
**Solutions**:
```bash
# Grant permissions:
chmod +x /tmp/GeminiPhotoEdit/*.sh

# If still failing, check system preferences:
System Preferences > Security & Privacy > Privacy > Full Disk Access
# Add Adobe Photoshop
```

#### "No Response Received"
**Causes**: API timeout or quota exceeded
**Solutions**:
1. Check Google Cloud Console for API usage
2. Verify billing account has sufficient credits
3. Try with smaller image (reduce to <2MB)
4. Check API quotas and limits

### Performance Issues

#### Slow Processing
**Causes**: Large images or complex prompts
**Solutions**:
1. Reduce image size before processing
2. Simplify prompts
3. Use Gemini Flash instead of Pro
4. Check network speed

#### Memory Errors
**Causes**: Very large images
**Solutions**:
1. Resize image to maximum 2048x2048
2. Work with selections instead of full image
3. Close other applications
4. Restart Photoshop

## Advanced Configuration

### Custom Parameters for Imagen

You can modify the helper scripts to include additional parameters:

```json
{
  "guidance_scale": 7.5,
  "num_inference_steps": 20,
  "negative_prompt": "blurry, low quality, distorted",
  "strength": 0.8,
  "seed": 12345
}
```

### Environment Variables

Set these for easier configuration:
```bash
# macOS/Linux
export GOOGLE_API_KEY="your-key-here"
export GOOGLE_PROJECT_ID="your-project-id"

# Windows
setx GOOGLE_API_KEY "your-key-here"
setx GOOGLE_PROJECT_ID "your-project-id"
```

### Batch Processing Setup

For processing multiple images:
1. Create a batch script that calls the helper scripts
2. Use Photoshop Actions to automate the workflow
3. Configure input/output folders

### Security Best Practices

1. **API Key Security**
   - Never share your API keys
   - Use environment variables for sensitive keys
   - Rotate keys regularly
   - Use service accounts for production

2. **File Security**
   - Temp files are automatically cleaned up
   - Sensitive images are processed locally
   - No data is stored on Google servers permanently

3. **Network Security**
   - All API calls use HTTPS
   - Consider using VPN for additional security
   - Monitor API usage in Google Cloud Console

### Performance Optimization

1. **Image Size Optimization**
   - Optimal size: 512x512 to 1024x1024 pixels
   - Larger images cost more and take longer
   - Use high-quality JPEG (90-95%) for uploads

2. **Prompt Optimization**
   - Be specific but concise
   - Include style and quality modifiers
   - Use negative prompts for unwanted elements

3. **Model Selection**
   - Gemini Flash: Fast analysis
   - Gemini Pro: Detailed analysis  
   - Imagen 2.0: Good quality generation
   - Imagen 3.0: Best quality generation

### Integration with Photoshop Actions

You can integrate these scripts with Photoshop Actions:

1. **Record an Action**
   - Start recording
   - Run the script
   - Stop recording

2. **Assign Keyboard Shortcut**
   - Edit > Keyboard Shortcuts
   - Expand Actions
   - Assign key to your action

3. **Batch Processing**
   - File > Automate > Batch
   - Select your action
   - Choose source folder
   - Run on multiple images

## Technical Details

### How the Integration Works

1. **Image Export**
   - Current selection or full image is exported as PNG/JPEG
   - Saved to temporary folder with unique timestamp

2. **API Communication**
   - Creates platform-specific script (PowerShell/Bash)
   - Encodes image as base64
   - Makes HTTP POST request to Google API
   - Handles authentication headers

3. **Response Processing**
   - Parses JSON response from Google
   - Extracts generated image or text response
   - Saves result to temporary file

4. **Import to Photoshop**
   - Opens result file in Photoshop
   - Creates new layer or replaces existing content
   - Cleans up temporary files

### API Endpoints Used

```
# Gemini API (AI Studio)
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

# Vertex AI Imagen (Cloud)
https://us-central1-aiplatform.googleapis.com/v1/projects/{project}/locations/us-central1/publishers/google/models/{model}:predict
```

### Authentication Methods

**API Key Authentication:**
```
Authorization: Bearer {api_key}
```

**OAuth 2.0 (Service Account):**
```
Authorization: Bearer {access_token}
```

### Request Format Examples

**Gemini Request:**
```json
{
  "contents": [{
    "parts": [
      {"text": "Analyze this image and suggest improvements"},
      {"inline_data": {
        "mime_type": "image/png",
        "data": "{base64_image_data}"
      }}
    ]
  }]
}
```

**Imagen Request:**
```json
{
  "instances": [{
    "prompt": "Add dramatic lighting to this photo",
    "image": {"bytesBase64Encoded": "{base64_image_data}"},
    "parameters": {
      "guidance_scale": 7.5,
      "number_of_inference_steps": 20
    }
  }]
}
```

### File Structure

```
Temporary Files Location:
├── Windows: %TEMP%\GeminiPhotoEdit\
├── macOS: $TMPDIR/GeminiPhotoEdit/
│
Generated Files:
├── input_{timestamp}.png     # Exported image
├── request_{timestamp}.json  # API request data
├── response_{timestamp}.txt  # API response
├── result_{timestamp}.png    # Generated result
└── helper_script.{ps1|sh}   # Platform-specific API script
```

### Error Handling

The scripts include comprehensive error handling:
- Network connectivity issues
- API authentication failures
- Invalid responses
- File I/O problems
- Photoshop integration errors

### Limitations and Considerations

1. **Image Size Limits**
   - Maximum recommended: 2048x2048 pixels
   - Larger images may timeout or fail
   - Consider resizing very large images

2. **API Quotas**
   - Free tier has daily/monthly limits
   - Paid tiers have higher quotas
   - Monitor usage in Google Cloud Console

3. **Content Policies**
   - Google has content filtering policies
   - Some prompts may be rejected
   - Review Google's AI Principles

4. **Processing Time**
   - Gemini analysis: 2-10 seconds
   - Imagen generation: 30-120 seconds
   - Varies by image size and complexity

## Cost Comparison

### Google AI Studio (Free Tier)
- **Gemini Flash**: 1,500 requests/day free
- **Gemini Pro**: 50 requests/day free
- **Cost beyond free**: $0.125-$1.25 per 1K requests

### Google Cloud Vertex AI
- **Imagen 2.0**: ~$0.02-0.05 per image
- **Imagen 3.0**: ~$0.08-0.12 per image
- **Gemini**: $0.00025-$0.0075 per request

*Significantly cheaper than Replicate.com for equivalent models*

## Getting Started Checklist

### For Beginners (Free Option):
- [ ] Create Google account
- [ ] Get free API key from aistudio.google.com
- [ ] Install `gemini_simple_edit.jsx`
- [ ] Test with image analysis
- [ ] Learn from AI suggestions

### For Professionals (Paid Option):
- [ ] Create Google Cloud account
- [ ] Set up project and billing
- [ ] Enable Vertex AI API
- [ ] Get credentials (API key or service account)
- [ ] Install `google_imagen_editor.jsx`
- [ ] Test with small images first
- [ ] Scale up for production use

## Support and Resources

### Official Documentation
- [Google AI Studio](https://aistudio.google.com/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Reference](https://ai.google.dev/docs)

### Community Resources
- [Adobe ExtendScript Documentation](https://theiviaxx.github.io/photoshop-docs/)
- [Photoshop Scripting Guide](https://helpx.adobe.com/photoshop/using/scripting.html)

### Getting Help
1. Check error messages in temp folder
2. Verify API credentials in Google Console
3. Test API independently using curl/browser
4. Check Photoshop's JavaScript console

---

**Ready to start AI editing with Google's powerful APIs! 🚀**