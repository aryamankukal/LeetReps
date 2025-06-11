# LeetReps - Master LeetCode with smart, spaced reviews

A Chrome extension that implements spaced repetition for LeetCode problems to help you retain knowledge and improve your problem-solving skills.

## Features

- **Automatic Problem Tracking**: Problems are only added when you successfully submit and get an accepted solution on LeetCode.
- **Spaced Repetition Algorithm**: Reviews are scheduled using exponential spacing, customizable to your target date (e.g., your next interview).
- **Custom Review Schedule**: Set your own Target Date (like your next interview) and the extension will automatically space your reviews up to that date.
- **Daily Review Queue**: See problems due for review today in a dedicated tab.
- **All Problems Management**: View, filter, and manage all saved problems in a separate tab.
- **Time Tracking**: Tracks how long you spend on each problem.
- **Data Export**: Export your problem data for backup or analysis.
- **Dark Mode**: Toggle a beautiful dark mode with a modern animated switch.

## Spaced Repetition Algorithm

The extension uses an exponential spacing system:
- You set a **Target Date** (e.g., your next interview).
- Reviews are scheduled at increasing intervals from when you solve a problem up to your chosen target date.
- The algorithm adapts the number and spacing of reviews based on how far away your target date is.

## Usage

1. **Solve Problems**: Visit LeetCode and solve problems as usual. Problems are only added when you submit and get an accepted solution (currently adds all submissions, not just accepted ones, will fix this in the future)
2. **Set Your Target Date**: On first use, the extension will prompt you to set your Target Date (e.g., your next interview). You can change this anytime via the gear icon.
3. **Check Reviews**: Click the extension icon to see problems due for review today in the "Today's Reviews" tab.
4. **Mark as Reviewed**: Click "Mark Reviewed" after reviewing a problem to schedule the next review.
5. **Manage Problems**: Use the "All Problems" tab to view, filter by difficulty, and manage all saved problems.
6. **Toggle Dark Mode**: Use the switch in the footer to toggle dark mode.
7. **Export Data**: Use the Export Data button to download your problem data.
8. **Send Feedback**: Use the Feedback button in the header to open the feedback form.

## Permissions

- **storage**: To save problem data locally
- **activeTab**: To access current tab information
- **scripting**: To inject content scripts
- **notifications**: To show review reminders (if enabled)
- **host_permissions**: To access LeetCode.com

## Data Privacy

- All data is stored locally in your browser using Chrome's storage API
- No data is sent to external servers
- You can export your data at any time
- You can clear all data using the "Clear All" button

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
