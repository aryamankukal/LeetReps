console.log('LeetCode Spaced Repetition: content.js loaded!');
// Content script for LeetCode spaced repetition extension
class LeetCodeMonitor {
  constructor() {
    this.isMonitoring = false;
    this.startTime = null;
    this.problemData = null;
    this.pageEntryTime = this.getOrSetPageEntryTime();
    this.hasSubmitted = false; // Add flag to prevent multiple submissions
    console.log('LeetCode Spaced Repetition: Page entry time:', this.pageEntryTime, new Date(this.pageEntryTime).toLocaleTimeString());
    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupMonitoring());
    } else {
      this.setupMonitoring();
    }
  }

  setupMonitoring() {
    // Check if we're on a problem page
    if (this.isProblemPage()) {
      // Only set up submission button monitoring, don't extract data yet
      this.monitorSubmissionButton();
    }
  }

  isProblemPage() {
    return window.location.pathname.includes('/problems/') && 
           !window.location.pathname.includes('/submissions/');
  }

  extractProblemData() {
    try {
      // Try multiple selectors for the problem title
      let title = '';
      let titleElement = document.querySelector('[data-cy="question-title"]');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      if (!title) {
        // Try LeetCode's new header structure
        const h1 = document.querySelector('h1');
        if (h1) title = h1.textContent.trim();
      }
      if (!title) {
        // Try page title as a last resort
        title = document.title.replace(/ - LeetCode.*$/, '').trim();
      }

      // Extract problem number
      const numberMatch = title.match(/^(\d+)\./);
      const number = numberMatch ? parseInt(numberMatch[1]) : null;

      // Extract difficulty - try multiple selectors
      let difficultyElement = document.querySelector('[diff]');
      if (!difficultyElement) {
        difficultyElement = document.querySelector('.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard');
      }
      let difficulty = '';
      if (difficultyElement) {
        difficulty = difficultyElement.getAttribute('diff') || 
                    difficultyElement.textContent.trim() ||
                    (difficultyElement.className.includes('easy') ? 'Easy' : 
                     difficultyElement.className.includes('medium') ? 'Medium' :
                     difficultyElement.className.includes('hard') ? 'Hard' : '');
      }

      // Extract problem URL
      const url = window.location.href;

      // Extract tags (topics)
      let tags = [];
      // Try to find topic tags in the sidebar or header
      const tagElements = document.querySelectorAll('[data-cy="question-tags"] a, .tag__1PqS, .css-1kg1yv8 .css-1kg1yv8');
      if (tagElements.length === 0) {
        // Try LeetCode's new tag structure
        const altTagElements = document.querySelectorAll('.mt-2 .inline-block a, .mt-2 .inline-block span');
        altTagElements.forEach(el => {
          if (el.textContent) tags.push(el.textContent.trim());
        });
      } else {
        tagElements.forEach(el => {
          if (el.textContent) tags.push(el.textContent.trim());
        });
      }
      tags = Array.from(new Set(tags)); // Remove duplicates

      this.problemData = {
        id: number,
        title: title,
        difficulty: difficulty,
        url: url,
        tags: tags,
        timestamp: Date.now()
      };

      console.log('LeetCode Spaced Repetition: Problem data extracted:', this.problemData);
    } catch (error) {
      console.error('LeetCode Spaced Repetition: Error extracting problem data:', error);
    }
  }

  startSubmissionMonitoring() {
    if (this.isMonitoring) return;
    
    // Extract problem data only when user actually submits
    this.extractProblemData();
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.hasSubmitted = false; // Reset flag for new submission

    console.log('LeetCode Spaced Repetition: Starting submission monitoring');

    // Monitor for submission success
    this.observeSubmissionResults();
    
    // Additional monitoring for success messages
    this.monitorSuccessMessages();
  }

  observeSubmissionResults() {
    // Create a mutation observer to watch for submission results
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForSuccess(node);
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  monitorSubmissionButton() {
    // Monitor for submission button clicks
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.textContent.includes('Submit') || 
          target.closest('[data-cy="submit-code-btn"]') ||
          target.closest('button[type="submit"]')) {
        console.log('LeetCode Spaced Repetition: Submit button clicked, starting monitoring');
        this.startSubmissionMonitoring();
      }
    });
  }

  monitorSuccessMessages() {
    // Check for success messages every 2 seconds after submission
    setInterval(() => {
      if (this.isMonitoring && this.startTime) {
        this.checkForSuccessInDOM();
      }
    }, 2000);
  }

  checkForSuccessInDOM() {
    // Check the entire DOM for success indicators
    const successSelectors = [
      '[data-cy="submission-success"]',
      '.success',
      '[class*="success"]',
      '[class*="accepted"]',
      '.text-success',
      '.text-green-600',
      '.text-green-500'
    ];

    for (const selector of successSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.textContent.includes('Accepted') || 
            element.textContent.includes('Success') ||
            element.textContent.includes('✓') ||
            element.textContent.includes('✅')) {
          this.handleSuccessfulSubmission();
          return;
        }
      }
    }

    // Check for "Accepted" text anywhere in the page
    const allText = document.body.textContent;
    if (allText.includes('Accepted') && this.isMonitoring) {
      // Double check it's not an old message
      const timeSinceSubmission = Date.now() - this.startTime;
      if (timeSinceSubmission < 30000) { // Within 30 seconds of submission
        this.handleSuccessfulSubmission();
        return;
      }
    }
  }

  checkForSuccess(element) {
    // Check for success indicators
    const successSelectors = [
      '[data-cy="submission-success"]',
      '.success',
      '[class*="success"]',
      '[class*="accepted"]',
      '.text-success',
      '.text-green-600',
      '.text-green-500'
    ];

    for (const selector of successSelectors) {
      if (element.matches(selector) || element.querySelector(selector)) {
        this.handleSuccessfulSubmission();
        return;
      }
    }

    // Check for "Accepted" text
    if (element.textContent && element.textContent.includes('Accepted')) {
      this.handleSuccessfulSubmission();
      return;
    }

    // Check for green checkmark or success icon
    const successIcons = element.querySelectorAll('svg, i, span');
    for (const icon of successIcons) {
      if (
        (typeof icon.textContent === 'string' && (icon.textContent.includes('✓') || icon.textContent.includes('✅')))
        ||
        (typeof icon.className === 'string' && (icon.className.includes('success') || icon.className.includes('accepted')))
      ) {
        this.handleSuccessfulSubmission();
        return;
      }
    }
  }

  handleSuccessfulSubmission() {
    if (!this.problemData || !this.pageEntryTime || this.hasSubmitted) return;

    // Prevent multiple submissions
    this.hasSubmitted = true;

    // Time spent from page load to accepted
    const timeSpent = Date.now() - this.pageEntryTime;

    const submissionData = {
      ...this.problemData,
      timeSpent: timeSpent,
      submittedAt: Date.now(),
      nextReview: this.calculateNextReview(timeSpent)
    };

    // Send data to background script
    chrome.runtime.sendMessage({
      type: 'PROBLEM_SOLVED',
      data: submissionData
    });

    console.log('LeetCode Spaced Repetition: Problem solved!', submissionData);
    
    // Reset monitoring
    this.isMonitoring = false;
    this.startTime = null;
    // Clear entry time for this problem so future visits are fresh
    const key = 'leetcodePageEntryTime_' + window.location.pathname;
    sessionStorage.removeItem(key);
  }

  calculateNextReview(timeSpent) {
    // Simple spaced repetition algorithm
    // Base interval: 1 day
    // Factor based on time spent (longer time = more difficult = shorter interval)
    const baseInterval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const timeFactor = Math.max(0.5, Math.min(2, timeSpent / (5 * 60 * 1000))); // 5 minutes as baseline
    
    // Difficulty multiplier
    const difficultyMultiplier = {
      'Easy': 1.5,
      'Medium': 1.0,
      'Hard': 0.7
    };
    
    const multiplier = difficultyMultiplier[this.problemData.difficulty] || 1.0;
    
    const interval = baseInterval * timeFactor * multiplier;
    return Date.now() + interval;
  }

  getOrSetPageEntryTime() {
    // Use sessionStorage to persist entry time across reloads for this problem
    const key = 'leetcodePageEntryTime_' + window.location.pathname;
    let entryTime = sessionStorage.getItem(key);
    if (!entryTime) {
      entryTime = Date.now();
      sessionStorage.setItem(key, entryTime);
    }
    return parseInt(entryTime, 10);
  }
}

// Initialize the monitor
new LeetCodeMonitor(); 