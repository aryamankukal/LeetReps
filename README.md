# LeetCode Spaced Repetition Extension

A Chrome extension that implements spaced repetition for LeetCode problems to help you retain knowledge and improve your problem-solving skills.

## Features

- **Automatic Problem Tracking**: Automatically saves problems when you successfully submit solutions on LeetCode
- **Spaced Repetition Algorithm**: Schedules reviews based on difficulty and time spent solving
- **Daily Review Queue**: Shows problems due for review today
- **Problem Management**: View all saved problems, filter by difficulty, and manage your collection
- **Time Tracking**: Tracks how long you spend on each problem
- **Data Export**: Export your problem data for backup or analysis
- **Modern UI**: Clean, responsive interface with smooth animations

## Spaced Repetition Algorithm

The extension uses an exponential backoff system:
- 1st review: 1 day later
- 2nd review: 3 days later
- 3rd review: 1 week later
- 4th review: 2 weeks later
- 5th review: 1 month later
- And so on...

Difficulty adjustments:
- Easy problems: 1.5x longer intervals
- Medium problems: 1.0x intervals (baseline)
- Hard problems: 0.7x shorter intervals

## Installation

### Method 1: Manual Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published.

## Usage

1. **Solve Problems**: Visit LeetCode and solve problems as usual
2. **Automatic Saving**: When you successfully submit a solution, the problem is automatically saved
3. **Check Reviews**: Click the extension icon to see problems due for review today
4. **Mark as Reviewed**: Click "Mark Reviewed" after reviewing a problem to schedule the next review
5. **Manage Problems**: Use the "All Problems" tab to view all saved problems and manage them

## File Structure

```
├── manifest.json          # Extension manifest
├── content.js            # Content script for LeetCode monitoring
├── background.js         # Background service worker
├── popup.html           # Extension popup interface
├── popup.css            # Popup styles
├── popup.js             # Popup functionality
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md            # This file
├── LICENSE              # MIT License
├── CONTRIBUTING.md      # Contributing guidelines
└── .gitignore          # Git ignore file
```

## Permissions

- **storage**: To save problem data locally
- **activeTab**: To access current tab information
- **scripting**: To inject content scripts
- **host_permissions**: To access LeetCode.com

## Data Privacy

- All data is stored locally in your browser using Chrome's storage API
- No data is sent to external servers
- You can export your data at any time
- You can clear all data using the "Clear All" button

## Development

### Testing

To add test problems for development:

```javascript
chrome.storage.local.get(['problems'], (result) => {
  const problems = result.problems || {};
  const now = Date.now();
  problems['test-problem'] = {
    id: 'test-problem',
    title: 'Test Problem',
    url: 'https://leetcode.com/problems/test-problem',
    difficulty: 'Medium',
    solveCount: 1,
    reviewCount: 0,
    lastReviewed: null,
    createdAt: now - (7 * 24 * 60 * 60 * 1000),
    nextReview: now - 1000, // Due for review now
    timeSpent: 60000
  };
  chrome.storage.local.set({ problems });
});
```

### Building

1. Make your changes to the source files
2. Reload the extension in Chrome
3. Test thoroughly before committing

## Troubleshooting

### Extension not detecting submissions
- Make sure you're on a LeetCode problem page (not submissions page)
- Try refreshing the page
- Check the browser console for any error messages

### Problems not appearing in reviews
- Check that the problem's `nextReview` date is in the past
- Reload the extension
- Check the browser console for errors

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by spaced repetition learning techniques
- Built for the LeetCode community
- Thanks to all contributors and users 