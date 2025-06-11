// Background service worker for LeetCode spaced repetition extension
class SpacedRepetitionManager {
  constructor() {
    this.problems = new Map();
    this.init();
  }

  async init() {
    // Load existing problems from storage
    await this.loadProblems();
    
    // Fix any existing problems that don't have nextReview dates
    await this.fixMissingNextReviewDates();
    
    // Set up message listeners
    this.setupMessageListeners();
    
    // Set up daily check for review problems
    this.scheduleDailyCheck();
  }

  async loadProblems() {
    try {
      const result = await chrome.storage.local.get(['problems']);
      if (result.problems) {
        this.problems = new Map(Object.entries(result.problems));
      }
    } catch (error) {
      console.error('Error loading problems:', error);
    }
  }

  async saveProblems() {
    try {
      const problemsObj = Object.fromEntries(this.problems);
      await chrome.storage.local.set({ problems: problemsObj });
    } catch (error) {
      console.error('Error saving problems:', error);
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'PROBLEM_SOLVED':
          this.handleProblemSolved(message.data);
          break;
        case 'GET_DAILY_REVIEWS':
          this.loadProblems().then(() => this.getDailyReviews().then(sendResponse));
          return true; // Keep message channel open for async response
        case 'GET_ALL_PROBLEMS':
          this.loadProblems().then(() => this.getAllProblems().then(sendResponse));
          return true;
        case 'MARK_REVIEWED':
          this.markAsReviewed(message.problemId).then(sendResponse);
          return true;
        case 'DELETE_PROBLEM':
          this.deleteProblem(message.problemId).then(sendResponse);
          return true;
        case 'CLEAR_ALL_PROBLEMS':
          this.clearAllProblems().then(sendResponse);
          return true;
      }
    });
  }

  handleProblemSolved(problemData) {
    const problemId = problemData.id || problemData.url;
    if (!problemId) {
      console.error('No problem ID found:', problemData);
      return;
    }

    // Normalize URL (remove query params and trailing slash)
    function normalizeUrl(url) {
      try {
        let u = new URL(url);
        u.search = '';
        let s = u.toString();
        if (s.endsWith('/')) s = s.slice(0, -1);
        return s;
      } catch {
        return url;
      }
    }
    const newTitle = (problemData.title || '').trim().toLowerCase();
    const newUrl = normalizeUrl(problemData.url || '');

    // Find a matching problem by title or normalized url
    let matchKey = null;
    let matchProblem = null;
    for (const [key, existing] of this.problems) {
      const existingTitle = (existing.title || '').trim().toLowerCase();
      const existingUrl = normalizeUrl(existing.url || '');
      if ((existingTitle && newTitle && existingTitle === newTitle) ||
          (existingUrl && newUrl && existingUrl === newUrl)) {
        matchKey = key;
        matchProblem = existing;
        break;
      }
    }

    const now = Date.now();
    if (matchProblem) {
      // Update existing problem if due for review
      if (matchProblem.nextReview && matchProblem.nextReview <= now) {
        matchProblem.lastSolved = problemData.submittedAt;
        matchProblem.timeSpent = problemData.timeSpent;
        matchProblem.solveCount = (matchProblem.solveCount || 0) + 1;
        matchProblem.lastReviewed = now;
        matchProblem.reviewCount = (matchProblem.reviewCount || 0) + 1;
        matchProblem.nextReview = this.calculateNextReview(matchProblem);
        this.problems.set(matchKey, matchProblem);
        this.saveProblems();
        console.log('Problem updated (was due for review):', matchProblem.title);
      } else {
        // Not due for review, ignore
        console.log('Problem submission ignored (not due for review):', matchProblem.title);
      }
      return;
    }

    // If no match, check if problem already exists by id (legacy fallback)
    const existingProblem = this.problems.get(problemId.toString());
    if (existingProblem) {
      if (existingProblem.nextReview && existingProblem.nextReview <= now) {
        existingProblem.lastSolved = problemData.submittedAt;
        existingProblem.timeSpent = problemData.timeSpent;
        existingProblem.solveCount = (existingProblem.solveCount || 0) + 1;
        existingProblem.lastReviewed = now;
        existingProblem.reviewCount = (existingProblem.reviewCount || 0) + 1;
        existingProblem.nextReview = this.calculateNextReview(existingProblem);
        this.problems.set(problemId.toString(), existingProblem);
        this.saveProblems();
        console.log('Problem updated (was due for review):', existingProblem.title);
      } else {
        console.log('Problem submission ignored (not due for review):', existingProblem.title);
      }
      return;
    }

    // Add new problem (no match found)
    const newProblem = {
      ...problemData,
      solveCount: 1,
      reviewCount: 0,
      lastReviewed: null,
      createdAt: Date.now(),
      nextReview: this.calculateNextReview(problemData)
    };
    console.log('[SR] New problem nextReview:', newProblem.nextReview, new Date(newProblem.nextReview).toLocaleString());
    this.problems.set(problemId.toString(), newProblem);
    this.saveProblems();
    console.log('New problem added:', problemData.title);
  }

  async getDailyReviews() {
    const now = Date.now();
    const reviews = [];
    for (const [id, problem] of this.problems) {
      if (problem.nextReview && problem.nextReview <= now) {
        reviews.push({
          id,
          ...problem,
          daysSinceLastReview: this.getDaysSinceLastReview(problem)
        });
      }
    }
    return reviews;
  }

  async getAllProblems() {
    const problems = [];
    for (const [id, problem] of this.problems) {
      problems.push({
        id,
        ...problem,
        daysSinceLastReview: this.getDaysSinceLastReview(problem),
        isDueForReview: problem.nextReview && problem.nextReview <= Date.now()
      });
    }

    // Sort by next review date
    problems.sort((a, b) => {
      if (!a.nextReview && !b.nextReview) return 0;
      if (!a.nextReview) return 1;
      if (!b.nextReview) return -1;
      return a.nextReview - b.nextReview;
    });

    return problems;
  }

  async markAsReviewed(problemId) {
    const problem = this.problems.get(problemId);
    if (!problem) return false;

    // Only update review fields, never delete
    problem.lastReviewed = Date.now();
    problem.reviewCount = (problem.reviewCount || 0) + 1;
    problem.nextReview = this.calculateNextReview(problem);

    await this.saveProblems();
    return true;
  }

  async deleteProblem(problemId) {
    console.log('[SR] Attempting to delete problem:', problemId);
    let deleted = false;
    if (this.problems.has(problemId)) {
      deleted = this.problems.delete(problemId);
      console.log('[SR] Deleted by id:', problemId, 'Success:', deleted);
    } else {
      for (const [key, problem] of this.problems) {
        if (problem.url === problemId) {
          deleted = this.problems.delete(key);
          console.log('[SR] Deleted by url:', problemId, 'Key:', key, 'Success:', deleted);
          break;
        }
      }
    }
    if (deleted) {
      await this.saveProblems();
      console.log('[SR] Problems saved after deletion.');
    } else {
      console.log('[SR] Problem not found for deletion:', problemId);
    }
    // Always reload from storage after mutation
    await this.loadProblems();
    return deleted;
  }

  calculateNextReview(problem) {
    try {
      const startStr = localStorage.getItem('sr_study_start');
      const endStr = localStorage.getItem('sr_study_end');
      if (startStr && endStr) {
        let startDate = new Date(startStr).setHours(0,0,0,0);
        const endDate = new Date(endStr).setHours(0,0,0,0);
        let createdAt = problem.createdAt || Date.now();
        if (createdAt < startDate) createdAt = startDate;
        if (createdAt > endDate) return endDate;
        const reviewCount = problem.reviewCount || 0;
        // Generate intervals in days
        const intervals = this.generateReviewIntervals(createdAt, endDate);
        // Calculate the next review date
        let next;
        if (reviewCount < intervals.length) {
          next = createdAt + intervals[reviewCount] * 24 * 60 * 60 * 1000;
        } else {
          next = endDate;
        }
        if (next > endDate) next = endDate;
        const nextDate = new Date(next); nextDate.setHours(0,0,0,0);
        return nextDate.getTime();
      }
    } catch (e) {
      // Fallback to default
    }
    // Default spaced repetition intervals in days
    const reviewCount = problem.reviewCount || 0;
    const intervals = [1, 3, 7, 14, 30, 60, 120, 240];
    const intervalIndex = Math.min(reviewCount, intervals.length - 1);
    const intervalDays = intervals[intervalIndex];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    return targetDate.getTime();
  }

  getDaysSinceLastReview(problem) {
    if (!problem.lastReviewed) return null;
    const now = Date.now();
    const diffMs = now - problem.lastReviewed;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  scheduleDailyCheck() {
    // Check for review problems every hour
    setInterval(() => {
      this.checkForReviewNotifications();
    }, 60 * 60 * 1000); // every 1 hour
    // Also check immediately
    this.checkForReviewNotifications();
  }

  async checkForReviewNotifications() {
    const reviews = await this.getDailyReviews();
    if (reviews.length > 0) {
      // Update badge with number of problems due for review
      chrome.action.setBadgeText({
        text: reviews.length.toString()
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#ff4444'
      });
      // Show notification (once per day)
      const today = new Date();
      const todayKey = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
      chrome.storage.local.get(['lastNotification'], (result) => {
        if (result.lastNotification !== todayKey) {
          chrome.notifications.create('leetreview-due', {
            type: 'basic',
            iconUrl: 'icons/lc128icon.png',
            title: 'LeetReview: Reviews Due',
            message: `You have ${reviews.length} problem(s) to review today!`,
            priority: 2
          });
          chrome.storage.local.set({ lastNotification: todayKey });
        }
      });
    } else {
      chrome.action.setBadgeText({
        text: ''
      });
    }
  }

  async clearAllProblems() {
    this.problems.clear();
    await chrome.storage.local.remove(['problems']);
    // Always reload from storage after mutation
    await this.loadProblems();
    return true;
  }

  async fixMissingNextReviewDates() {
    let fixed = false;
    
    for (const [id, problem] of this.problems) {
      if (!problem.nextReview) {
        problem.nextReview = this.calculateNextReview(problem);
        fixed = true;
        console.log('[SR] Fixed missing nextReview for problem:', problem.title);
      }
    }
    
    if (fixed) {
      await this.saveProblems();
      console.log('[SR] Fixed missing nextReview dates for existing problems');
    }
  }

  // Generate review intervals (in days) using exponential spacing
  generateReviewIntervals(problemDate, endDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const D = Math.round((endDate - problemDate) / msPerDay);
    let N;
    if (D <= 7) N = 1;
    else if (D <= 14) N = 2;
    else if (D <= 30) N = 3;
    else if (D <= 45) N = 4;
    else N = 5;
    const intervals = [];
    for (let i = 1; i <= N; i++) {
      intervals.push(Math.round(D * Math.pow(i / N, 2)));
    }
    return intervals;
  }
}

// Initialize the manager
self.manager = new SpacedRepetitionManager(); 