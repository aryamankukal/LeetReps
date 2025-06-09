# Testing Guide for LeetCode Spaced Repetition Extension

## Step 1: Generate Icons

1. **Open the icon generator**: Open `generate_icons.html` in your browser
2. **Download icons**: Click each download button to save:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
3. **Move icons**: Place all three files in the `icons/` folder

## Step 2: Install the Extension

1. **Open Chrome Extensions**: Go to `chrome://extensions/`
2. **Enable Developer Mode**: Toggle the switch in the top-right corner
3. **Load Extension**: Click "Load unpacked" and select your extension folder
4. **Verify Installation**: The extension should appear in your extensions list with the "LR" icon

## Step 3: Test Basic Functionality

### Test 1: Extension Popup
1. Click the extension icon in your Chrome toolbar
2. You should see the popup with:
   - Header showing "LeetCode Spaced Repetition"
   - Two tabs: "Today's Reviews" and "All Problems"
   - Stats showing "0 problems"
3. Try switching between tabs

### Test 2: Empty State
1. The "Today's Reviews" tab should show "No problems due for review today!"
2. The "All Problems" tab should show "No problems saved yet!"
3. This is expected since you haven't solved any problems yet

## Step 4: Test LeetCode Integration

### Test 3: Problem Detection
1. **Visit LeetCode**: Go to https://leetcode.com/problems/two-sum/
2. **Check Console**: Open Developer Tools (F12) and check the Console tab
3. **Look for Message**: You should see: "LeetCode Spaced Repetition: Problem data extracted: {...}"
4. **Verify Data**: The console should show problem details like ID, title, difficulty, and URL

### Test 4: Submission Monitoring
1. **Solve a Problem**: Try to solve the Two Sum problem (or any easy problem)
2. **Submit Solution**: Write and submit a solution
3. **Check for Success**: Look for "LeetCode Spaced Repetition: Problem solved!" in the console
4. **Verify Data**: The console should show submission data including time spent

### Test 5: Extension Updates
1. **Check Popup**: Click the extension icon again
2. **Verify Changes**: You should now see:
   - Total problems count increased
   - The solved problem in the "All Problems" tab
   - Problem details including difficulty, solve count, and time spent

## Step 5: Test Spaced Repetition Features

### Test 6: Review Scheduling
1. **Check Next Review**: In the "All Problems" tab, verify the "Next review" date
2. **Mark as Reviewed**: Click "Mark Reviewed" on a problem
3. **Verify Update**: The next review date should change to a later date
4. **Check Review Count**: The review count should increase

### Test 7: Daily Reviews
1. **Modify Review Date**: Temporarily change a problem's next review to today's date
2. **Check Reviews Tab**: The problem should appear in "Today's Reviews"
3. **Verify Priority**: Hard problems should appear before Easy problems

### Test 8: Badge Notifications
1. **Check Badge**: The extension icon should show a red badge with the number of problems due for review
2. **No Reviews**: When no problems are due, the badge should disappear

## Step 6: Test Advanced Features

### Test 9: Filtering
1. **Use Difficulty Filter**: In "All Problems" tab, try filtering by Easy/Medium/Hard
2. **Verify Results**: Only problems of the selected difficulty should show

### Test 10: Data Management
1. **Export Data**: Click "Export Data" and verify the JSON file downloads
2. **Delete Problem**: Try deleting a problem and verify it's removed
3. **Clear All**: Test the "Clear All" function (be careful - this deletes all data!)

### Test 11: Problem Links
1. **Open Problem**: Click "Open Problem" on any saved problem
2. **Verify Navigation**: Should open the LeetCode problem page in a new tab

## Step 7: Edge Cases

### Test 12: Error Handling
1. **Invalid Pages**: Visit non-problem pages on LeetCode (like homepage)
2. **Verify Behavior**: Extension should not crash or show errors
3. **Console Messages**: Check for appropriate console messages

### Test 13: Multiple Submissions
1. **Solve Same Problem**: Submit the same problem multiple times
2. **Verify Updates**: Solve count should increase, last solved time should update

### Test 14: Browser Restart
1. **Restart Chrome**: Close and reopen Chrome
2. **Check Persistence**: Your saved problems should still be there
3. **Verify Badge**: Badge count should be correct

## Troubleshooting Common Issues

### Extension Not Loading
- **Check Icons**: Ensure all three icon files exist in the `icons/` folder
- **Check Manifest**: Verify `manifest.json` is valid JSON
- **Check Console**: Look for errors in the extensions page

### Not Detecting Submissions
- **Check URL**: Make sure you're on a problem page (not submissions page)
- **Check Console**: Look for "Problem data extracted" message
- **Refresh Page**: Try refreshing the LeetCode page
- **Check Permissions**: Verify extension has permission to access LeetCode.com

### Data Not Saving
- **Check Storage**: Open Developer Tools → Application → Storage → Local Storage
- **Check Console**: Look for "Problem saved" messages
- **Check Permissions**: Verify storage permission is granted

### UI Issues
- **Check CSS**: Verify `popup.css` is loading correctly
- **Check Console**: Look for JavaScript errors in popup console
- **Refresh Extension**: Try reloading the extension

## Performance Testing

### Test 15: Large Dataset
1. **Add Many Problems**: Solve 20+ problems to test with larger dataset
2. **Check Performance**: Verify popup loads quickly
3. **Check Memory**: Monitor memory usage in Task Manager

### Test 16: Long-term Usage
1. **Use for a Week**: Use the extension daily for a week
2. **Check Data Integrity**: Verify all data persists correctly
3. **Check Review Scheduling**: Verify spaced repetition intervals work correctly

## Success Criteria

✅ Extension loads without errors  
✅ Icons display correctly  
✅ Popup opens and functions properly  
✅ Problem detection works on LeetCode  
✅ Submission monitoring captures successful solves  
✅ Data persists across browser sessions  
✅ Spaced repetition scheduling works correctly  
✅ Badge notifications update properly  
✅ All UI features work as expected  
✅ Export/import functionality works  
✅ No console errors during normal operation  

If all tests pass, your extension is ready for use! 🎉 