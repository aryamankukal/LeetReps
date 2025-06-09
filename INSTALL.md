# Quick Installation Guide

## Step 1: Create Icons (Required)

Before installing the extension, you need to create the icon files. You can either:

### Option A: Use Online Icon Generator
1. Go to https://www.favicon-generator.org/ or similar icon generator
2. Create a simple icon with "LR" text and gradient background
3. Download in sizes: 16x16, 48x48, and 128x128 pixels
4. Save as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons/` folder

### Option B: Create Simple Icons Manually
1. Create an `icons` folder in the extension directory
2. Create simple PNG files with the following specifications:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels) 
   - `icon128.png` (128x128 pixels)
3. Use any image editor (GIMP, Photoshop, or online tools)

## Step 2: Install Extension

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select the extension folder containing all the files
6. The extension should now appear in your extensions list

## Step 3: Test the Extension

1. Go to any LeetCode problem page (e.g., https://leetcode.com/problems/two-sum/)
2. Solve the problem and submit your solution
3. If successful, the problem should be automatically saved
4. Click the extension icon to see your saved problems

## Troubleshooting

- **Extension not loading**: Make sure all files are present and the `icons/` folder exists with the required PNG files
- **Not detecting submissions**: Ensure you're on a LeetCode problem page, not the submissions page
- **Data not saving**: Check that the extension has permission to access LeetCode.com

## File Structure After Installation

```
your-extension-folder/
├── manifest.json
├── content.js
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── package.json
├── README.md
├── INSTALL.md
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
``` 