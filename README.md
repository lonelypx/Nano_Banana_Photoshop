# AI Image Edit Script for Adobe Photoshop

A powerful ExtendScript (JSX) implementation that brings AI-powered image editing capabilities directly into Adobe Photoshop. This script replicates the functionality of commercial AI editing tools, supporting multiple AI models including Google's Nano Banana (Gemini 2.5 Flash) and Black Forest Labs' Flux Kontext models.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Initial Setup](#initial-setup)
- [How to Use](#how-to-use)
- [Supported AI Models](#supported-ai-models)
- [API Integration](#api-integration)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)
- [Platform-Specific Notes](#platform-specific-notes)
- [Limitations](#limitations)
- [Development](#development)

## Features

- 🎨 **AI-Powered Image Editing**: Transform selections or entire images using natural language prompts
- 🤖 **Multiple AI Model Support**: Choose between Nano Banana, Flux Kontext Pro, and Flux Kontext Max
- 🎯 **Smart Selection Processing**: Edit specific areas or the entire image
- 🌈 **Foreground Color Integration**: Use Photoshop's foreground color in AI edits (Nano Banana)
- 🖼️ **Reference Image Support**: Guide AI edits with reference images (Nano Banana, macOS only)
- 📊 **Progress Tracking**: Real-time progress updates during processing
- 💾 **Settings Persistence**: Saves your API keys and preferences
- 🔄 **Result Options**: Create edits as new layers or replace existing content
- 🔍 **2x Upscaling**: Optional upscaling for higher resolution results

## Requirements

### Software Requirements
- Adobe Photoshop CS6 or later
- Windows 10/11 or macOS 10.12+
- Active internet connection

### API Requirements
- API key from one of the supported services:
  - [Replicate.com](https://replicate.com) account with $10+ credits
  - Custom AI API endpoint (OpenAI, Stability AI, etc.)

### System Requirements
- **Windows**: PowerShell 3.0 or later (included in Windows 10/11)
- **macOS**: bash shell (included by default)
- **Optional**: ImageMagick (for enhanced demo mode on macOS)

## Installation

### Step 1: Download the Scripts

Download all three script files to your computer:
- `ai_edit_complete.jsx` - Main script
- `setup_helper.jsx` - Setup utility
- `ai_image_edit_script.jsx` - Alternative basic version

### Step 2: Install in Photoshop

#### Method 1: Scripts Menu (Recommended)
1. Copy all `.jsx` files to Photoshop's Scripts folder:
   - **Windows**: `C:\Program Files\Adobe\Adobe Photoshop [Version]\Presets\Scripts\`
   - **macOS**: `/Applications/Adobe Photoshop [Version]/Presets/Scripts/`
2. Restart Photoshop
3. Access via `File > Scripts > [Script Name]`

#### Method 2: Manual Execution
1. In Photoshop, go to `File > Scripts > Browse...`
2. Navigate to where you saved the scripts
3. Select the script you want to run

### Step 3: Create Keyboard Shortcuts (Optional)

1. Go to `Edit > Keyboard Shortcuts...`
2. In the dropdown, select `Application Menus`
3. Expand `File > Scripts`
4. Assign shortcuts to your scripts (e.g., `Cmd/Ctrl + Shift + A` for AI Edit)

## Initial Setup

### 1. Run the Setup Helper

First time only:
1. Open Photoshop
2. Run `setup_helper.jsx` via `File > Scripts > setup_helper`
3. This creates necessary helper scripts in your temp folder
4. You'll see a confirmation message when complete

### 2. Configure API Access

1. Run `ai_edit_complete.jsx`
2. Since no API key is configured, the Settings dialog will open
3. Enter your configuration:
   - **API Key**: Your Replicate.com token or custom API key
   - **Service Type**: Choose Replicate.com or Custom Endpoint
   - **Model Selection**: Choose your preferred AI model

### 3. Get Your API Key

#### For Replicate.com:
1. Sign up at [Replicate.com](https://replicate.com)
2. Add credits to your account ($10 minimum recommended)
3. Go to [Account Settings](https://replicate.com/account)
4. Copy your API token

#### For Custom APIs:
Contact your API provider for authentication details.

## How to Use

### Basic Workflow

1. **Open an Image**
   ```
   Open any image in Photoshop that you want to edit
   ```

2. **Make a Selection** (Optional)
   - Use any selection tool (Marquee, Lasso, Magic Wand, etc.)
   - If no selection is made, the entire image will be processed

3. **Run the Script**
   - Go to `File > Scripts > ai_edit_complete`
   - Or use your keyboard shortcut

4. **Enter Your Prompt**
   - Describe what you want in natural language
   - Examples:
     - "Make it a winter scene with snow"
     - "Change the sky to sunset"
     - "Remove the background"
     - "Make it look like a painting"
     - "Add dramatic lighting"

5. **Configure Options**
   - **Create as new layer**: Preserves your original (recommended)
   - **Upscale result 2x**: Doubles the resolution
   - **Use foreground color**: Incorporates current color (Nano Banana only)

6. **Generate**
   - Click "Generate" and wait for processing
   - Progress bar shows current status
   - Result appears as a new layer or replaces selection

### Advanced Features

#### Using Reference Images (Nano Banana, macOS only)
1. In the options panel, click "Choose Image..."
2. Select an image to guide the style
3. The AI will blend your prompt with the reference style

#### Using Foreground Color (Nano Banana only)
1. Select a foreground color in Photoshop
2. Check "Use current foreground color"
3. The AI will incorporate this color into the edit

## Supported AI Models

### Nano Banana (Gemini 2.5 Flash)
- **Best for**: Fast, general-purpose edits
- **Features**: Foreground color, reference images
- **Cost**: ~$0.039 per image
- **Speed**: Fastest

### Flux Kontext Pro
- **Best for**: Context-aware edits, maintaining scene coherence
- **Features**: Advanced scene understanding
- **Cost**: ~$0.04 per image
- **Speed**: Moderate

### Flux Kontext Max
- **Best for**: Maximum quality, typography, complex edits
- **Features**: Best quality, handles text well
- **Cost**: ~$0.08 per image
- **Speed**: Slower but highest quality

## API Integration

### Understanding the Architecture

The script uses a three-part architecture to work around ExtendScript limitations:

1. **Main JSX Script**: Handles UI and Photoshop integration
2. **Helper Scripts**: Platform-specific scripts for API calls
3. **File-based Communication**: Data exchange via temporary files

### Modifying for Your API

The helper scripts are located in:
- **Windows**: `%TEMP%\PSAIEdit\ai_process.ps1`
- **macOS**: `$TMPDIR/PSAIEdit/ai_process.sh`

To integrate your own API:

1. Locate the helper script for your platform
2. Find the demo implementation section
3. Replace with your API calls:

#### Example for Replicate.com (PowerShell):
```powershell
# In ai_process.ps1, uncomment and modify:
Invoke-ReplicateAPI -ImagePath $ImagePath -Prompt $Prompt -ApiKey $ApiKey -Model "model-version-id"
```

#### Example for OpenAI (Shell):
```bash
# In ai_process.sh, uncomment and modify:
call_openai_style_api
```

### Custom API Integration

For completely custom APIs, modify the helper scripts to:
1. Encode the image to base64
2. Make the HTTP request
3. Parse the response
4. Save the result image

## Troubleshooting

### Common Issues

#### "Please open a document before running this script"
- **Solution**: Open or create a Photoshop document first

#### "No selection detected"
- **Solution**: Make a selection with any tool, or choose to process entire image

#### "Failed to process image"
- **Causes**:
  - Invalid API key
  - No internet connection
  - API service down
  - Insufficient credits
- **Solution**: Check Settings, verify API key and connection

#### Script doesn't appear in menu
- **Solution**: Ensure script is in correct folder and restart Photoshop

#### Windows Security Warning
- **Issue**: PowerShell execution policy
- **Solution**: The script handles this automatically, but you may need to approve on first run

### Platform-Specific Issues

#### macOS: "Operation not permitted"
- Run this in Terminal: `chmod +x "/tmp/PSAIEdit/ai_process.sh"`

#### Windows: PowerShell window appears
- This is normal behavior; the script runs in background

## Advanced Configuration

### Settings File Location

Your settings are saved in:
- **Windows**: `%APPDATA%\AIEdit_Settings.json`
- **macOS**: `~/Library/Application Support/AIEdit_Settings.json`

### Manual Configuration

Edit the settings file directly:
```json
{
  "apiKey": "your-api-key",
  "selectedModel": "nano-banana",
  "lastPrompt": "make it artistic",
  "useReplicate": true,
  "customEndpoint": ""
}
```

### Environment Variables

You can also set API keys via environment variables:
- `REPLICATE_API_TOKEN`
- `OPENAI_API_KEY`

## Platform-Specific Notes

### Windows
- Uses PowerShell for API calls
- Requires .NET Framework 4.5+
- May show UAC prompts on first run

### macOS
- Uses bash shell scripts
- Supports reference images (Nano Banana)
- Optional ImageMagick for demo mode

## Limitations

### ExtendScript Limitations
1. **No direct HTTP/HTTPS support**: Uses system calls
2. **No native JSON parsing**: Uses custom parsing
3. **Limited async operations**: Simulated progress
4. **No modern JavaScript**: Based on ECMAScript 3

### Functional Limitations
1. **File size**: Very large images may fail
2. **Processing time**: API calls can take 10-60 seconds
3. **Internet required**: No offline mode
4. **Format support**: JPEG output only

## Development

### Project Structure
```
/Nano_Banana_Photoshop/
├── README.md                  # This file
├── CLAUDE.md                  # AI assistant reference
├── ai_edit_complete.jsx       # Main production script
├── setup_helper.jsx           # Setup utility
├── ai_image_edit_script.jsx   # Basic version
└── nano_banana_flux_script.jsx # Original script (for reference)
```

### Debugging

1. **Enable ExtendScript Toolkit**:
   - Use Adobe ExtendScript Toolkit CC
   - Set breakpoints in JSX code

2. **Check Log Files**:
   - Temp folder contains request/response files
   - Helper scripts can write debug logs

3. **Test Mode**:
   - Scripts include demo mode for testing without API

### Contributing

To extend functionality:
1. Modify helper scripts for new APIs
2. Add new models to MODELS object
3. Implement new features in options
4. Test on both platforms

## Support

### Getting Help

1. **Check the error message** - Most issues have descriptive errors
2. **Verify API credentials** - Ensure key is valid and has credits
3. **Check internet connection** - API calls require internet
4. **Review helper scripts** - Ensure they weren't modified incorrectly

### Reporting Issues

When reporting problems, include:
- Photoshop version
- Operating system
- Error messages
- Steps to reproduce

## License

This script is provided as-is for educational and professional use. Respect the terms of service for any AI APIs you use.

## Acknowledgments

- Inspired by commercial AI editing tools
- Built for the Photoshop creative community
- Thanks to Adobe for ExtendScript capabilities

---

**Happy AI Editing!** 🎨🤖