# Troubleshooting Guide - Google AI Photoshop Integration

Complete troubleshooting guide for Google API integration with Photoshop ExtendScript.

## Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] **Internet connection** is working
- [ ] **API key** is valid and has quotas remaining  
- [ ] **Photoshop document** is open
- [ ] **Script permissions** are properly set
- [ ] **Temp folder** is accessible and has space

## Common Setup Issues

### 🔑 API Key Problems

#### Issue: "Invalid API Key" or "Authentication Failed"

**Symptoms:**
- Error dialog shows "API Key Invalid"
- No response from Google services
- 401 Unauthorized errors in logs

**Solutions:**

1. **Verify Key Source**
   ```
   Google AI Studio keys start with: AIza...
   Google Cloud API keys start with: AIza... (but different format)
   Service account keys are JSON files
   ```

2. **Check Key Validity**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Verify key is listed and active
   - Check usage limits haven't been exceeded

3. **Re-create Key**
   - Delete old key in Google AI Studio
   - Create new API key
   - Update script settings

4. **Test Key Independently**
   ```bash
   # macOS/Linux test
   curl -H "Content-Type: application/json" \
        -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY"
   ```

#### Issue: "Project ID Not Found" (Vertex AI)

**Solutions:**
1. **Check Project ID**
   - Go to Google Cloud Console
   - Copy exact Project ID (not project name)
   - Project ID format: `my-project-123456`

2. **Verify API Access**
   - Ensure Vertex AI API is enabled
   - Check billing is set up
   - Verify user has proper permissions

### 💻 Script Execution Issues

#### Issue: "Script Not Found in Menu"

**Symptoms:**
- Script doesn't appear in File > Scripts menu
- Error when trying to browse to script

**Solutions:**

1. **Check File Location**
   ```
   Windows: C:\Program Files\Adobe\Adobe Photoshop [Version]\Presets\Scripts\
   macOS: /Applications/Adobe Photoshop [Version]/Presets/Scripts/
   ```

2. **Verify File Extension**
   - Must be `.jsx` (not .js or .txt)
   - Check file isn't corrupted during download

3. **Restart Photoshop**
   - Close Photoshop completely
   - Restart application
   - Scripts should now appear

#### Issue: "Permission Denied" (macOS)

**Symptoms:**
- Script starts but fails during execution
- "Operation not permitted" errors

**Solutions:**

1. **Grant Full Disk Access**
   ```
   System Preferences > Security & Privacy > Privacy > Full Disk Access
   Add Adobe Photoshop
   Restart Photoshop
   ```

2. **Fix Temp Folder Permissions**
   ```bash
   chmod -R 755 /tmp/GeminiPhotoEdit/
   chmod +x /tmp/GeminiPhotoEdit/*.sh
   ```

3. **Check Gatekeeper**
   ```bash
   # If needed, temporarily disable for development
   sudo spctl --master-disable
   ```

### 🌐 Network and API Issues

#### Issue: "Network Connection Failed"

**Symptoms:**
- Timeouts during API calls
- No response after long wait
- "Failed to connect" errors

**Solutions:**

1. **Test Basic Connectivity**
   ```bash
   # Test Google connectivity
   ping generativelanguage.googleapis.com
   
   # Test HTTPS
   curl -I https://aistudio.google.com
   ```

2. **Check Firewall/Proxy**
   - Corporate firewalls may block AI APIs
   - Configure proxy settings if needed
   - Try from different network

3. **DNS Issues**
   ```bash
   # Flush DNS cache
   # Windows: ipconfig /flushdns
   # macOS: sudo dscacheutil -flushcache
   ```

#### Issue: "API Quota Exceeded"

**Symptoms:**
- "Quota exceeded" error messages
- 429 Too Many Requests errors
- Sudden failures after working fine

**Solutions:**

1. **Check Usage in Console**
   - Google AI Studio: Check usage dashboard
   - Google Cloud: APIs & Services > Quotas

2. **Understand Limits**
   ```
   Free Tier Limits (per day):
   - Gemini Flash: 1,500 requests
   - Gemini Pro: 50 requests
   
   Rate Limits:
   - 2 requests per minute (free)
   - 60 requests per minute (paid)
   ```

3. **Wait or Upgrade**
   - Wait for quota reset (next day)
   - Upgrade to paid tier for higher limits

### 📁 File System Issues

#### Issue: "Failed to Export Image"

**Symptoms:**
- Script fails at image export step
- "Cannot save document" errors
- Temp files not created

**Solutions:**

1. **Check Document State**
   ```javascript
   // Ensure document is in RGB mode
   if (doc.mode != DocumentMode.RGB) {
       doc.changeMode(ChangeMode.RGB);
   }
   ```

2. **Verify Selection**
   - Check if selection bounds are valid
   - Try with no selection (full image)
   - Test with simple rectangular selection

3. **Disk Space**
   - Ensure temp folder has 100MB+ free space
   - Clear old temp files manually if needed

#### Issue: "Cannot Import Result"

**Symptoms:**
- API succeeds but no layer appears
- "Failed to import" error
- Result file exists but can't open

**Solutions:**

1. **Check Result File**
   ```javascript
   var resultFile = new File(resultPath);
   if (resultFile.exists && resultFile.length > 0) {
       // File is valid
   } else {
       // File is corrupted or empty
   }
   ```

2. **Verify File Format**
   - Ensure result is valid PNG/JPEG
   - Check if file is corrupted
   - Try opening file manually in Photoshop

## Platform-Specific Troubleshooting

### Windows-Specific Issues

#### PowerShell Execution Policy
**Issue**: Scripts can't run due to execution policy

**Solution:**
```powershell
# Run as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for single execution:
powershell -ExecutionPolicy Bypass -File "script.ps1"
```

#### .NET Framework Issues
**Issue**: System.Drawing not available

**Solution:**
```powershell
# Check .NET version
[System.Environment]::Version

# If needed, install .NET Framework 4.5+
```

#### Windows Defender Blocking
**Issue**: Antivirus blocks script execution

**Solutions:**
1. Add Photoshop to Windows Defender exclusions
2. Add temp folder to exclusions
3. Temporarily disable real-time protection

### macOS-Specific Issues

#### Python Not Found
**Issue**: `python3` command not found

**Solutions:**
```bash
# Install Python 3 via Homebrew
brew install python3

# Or use system Python
python --version  # Check if available

# Update script to use available Python
which python3
```

#### curl SSL Issues
**Issue**: SSL certificate errors

**Solutions:**
```bash
# Update certificates
brew update && brew upgrade curl

# Or bypass SSL (not recommended for production)
curl -k ...  # Insecure mode
```

#### Xcode Command Line Tools
**Issue**: Development tools not found

**Solution:**
```bash
# Install Xcode command line tools
xcode-select --install
```

## Error Code Reference

### Google API Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 400 | Bad Request | Check request format, image encoding |
| 401 | Unauthorized | Verify API key, check permissions |
| 403 | Forbidden | Enable APIs, check billing |
| 404 | Not Found | Verify endpoint URL, model name |
| 413 | Payload Too Large | Reduce image size |
| 429 | Too Many Requests | Wait or upgrade quota |
| 500 | Internal Server Error | Retry after delay |

### ExtendScript Error Patterns

| Error Pattern | Cause | Solution |
|---------------|-------|----------|
| "Object does not support this property or method" | Using unsupported API | Check ExtendScript reference |
| "File not found" | Path issues | Use absolute paths |
| "Access denied" | Permissions | Check folder permissions |
| "Invalid character" | Encoding issues | Check string encoding |

## Performance Troubleshooting

### Slow Processing

**Symptoms:**
- API calls take very long
- Script appears to hang
- No progress updates

**Diagnostics:**
1. **Check Image Size**
   ```javascript
   var doc = app.activeDocument;
   var sizeMB = (doc.width * doc.height * 3) / (1024 * 1024);
   if (sizeMB > 10) {
       alert("Image is " + sizeMB.toFixed(1) + "MB. Consider resizing.");
   }
   ```

2. **Test Network Speed**
   - Upload speed affects API call time
   - Large images need fast upload

3. **Monitor API Status**
   - Check [Google Cloud Status](https://status.cloud.google.com)
   - Look for service disruptions

### Memory Issues

**Symptoms:**
- Photoshop becomes unresponsive
- "Out of memory" errors
- Script crashes

**Solutions:**
1. **Reduce Image Size**
   ```javascript
   // Resize before processing
   doc.resizeImage(1024, 1024, null, ResampleMethod.BICUBIC);
   ```

2. **Close Other Documents**
   - Work with single document
   - Close unnecessary layers

3. **Increase Virtual Memory**
   - Windows: Increase page file size
   - macOS: Free up disk space

## Validation Scripts

### API Connection Test
```javascript
// Test script to validate setup
function validateSetup() {
    var tests = [
        {name: "Internet Connection", test: testInternet},
        {name: "API Key Validity", test: testAPIKey},
        {name: "File Permissions", test: testFileAccess},
        {name: "Helper Scripts", test: testHelperScripts}
    ];
    
    var results = [];
    for (var i = 0; i < tests.length; i++) {
        results.push(tests[i].name + ": " + (tests[i].test() ? "✅" : "❌"));
    }
    
    alert("Setup Validation:\n" + results.join("\n"));
}
```

### System Requirements Check
```javascript
function checkSystemRequirements() {
    var requirements = [
        "Photoshop version: " + app.version,
        "Platform: " + $.os,
        "ExtendScript version: " + $.version,
        "Available memory: " + (app.freeMemory / 1024 / 1024).toFixed(0) + "MB"
    ];
    
    alert("System Info:\n" + requirements.join("\n"));
}
```

## Recovery Procedures

### When Everything Fails

1. **Reset Configuration**
   ```javascript
   // Delete config file to reset
   var configFile = new File(Folder.userData + "/GoogleAI_Config.json");
   if (configFile.exists) {
       configFile.remove();
   }
   ```

2. **Clear Temp Files**
   ```bash
   # Manual cleanup
   rm -rf /tmp/GeminiPhotoEdit/*  # macOS
   rmdir /s %TEMP%\GeminiPhotoEdit  # Windows
   ```

3. **Reinstall from Scratch**
   - Delete all script files
   - Clear settings and temp files
   - Follow setup guide again

### Emergency Backup Recovery

If you lose work due to script issues:
```javascript
// Check for auto-backup
var backupFile = new File(Folder.userData + "/PhotoshopAI_Backup_" + 
                         doc.name.replace(/\.[^\.]+$/, "") + ".psd");
```

---

**Still having issues? Check the temp folder for detailed error logs and the main documentation for additional help.**