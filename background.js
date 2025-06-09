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

    // Check if problem already exists
    const existingProblem = this.problems.get(problemId.toString());
    const now = Date.now();
    
    if (existingProblem) {
      // Update existing problem
      existingProblem.lastSolved = problemData.submittedAt;
      existingProblem.timeSpent = problemData.timeSpent;
      existingProblem.solveCount = (existingProblem.solveCount || 0) + 1;
      // Do NOT overwrite nextReview from content script
      // If due for review, auto-mark as reviewed
      if (existingProblem.nextReview && existingProblem.nextReview <= now) {
        existingProblem.lastReviewed = now;
        existingProblem.reviewCount = (existingProblem.reviewCount || 0) + 1;
        existingProblem.nextReview = this.calculateNextReview(existingProblem);
      }
    } else {
      // Add new problem
      const newProblem = {
        ...problemData,
        solveCount: 1,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: Date.now()
      };
      // Set initial next review date (1 day from now)
      newProblem.nextReview = this.calculateNextReview(newProblem);
      this.problems.set(problemId.toString(), newProblem);
    }

    this.saveProblems();
    console.log('Problem saved:', problemData.title);
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
    const baseInterval = 24 * 60 * 60 * 1000; // 1 day
    const reviewCount = problem.reviewCount || 0;
    
    // Exponential backoff: 1 day, 3 days, 1 week, 2 weeks, 1 month, etc.
    const intervals = [1, 3, 7, 14, 30, 60, 120, 240];
    const intervalIndex = Math.min(reviewCount, intervals.length - 1);
    const intervalDays = intervals[intervalIndex];
    
    // Adjust based on difficulty
    const difficultyMultiplier = {
      'Easy': 1.5,
      'Medium': 1.0,
      'Hard': 0.7
    };
    
    const multiplier = difficultyMultiplier[problem.difficulty] || 1.0;
    const adjustedInterval = intervalDays * multiplier * baseInterval;
    
    return Date.now() + adjustedInterval;
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
    }, 60 * 60 * 1000);
    
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
}

// Initialize the manager
new SpacedRepetitionManager(); 