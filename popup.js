// Popup script for LeetCode spaced repetition extension
class PopupManager {
  constructor() {
    this.currentTab = 'reviews';
    this.allProblems = [];
    this.dailyReviews = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Filter changes
    const diffFilter = document.getElementById('difficultyFilter');
    if (diffFilter) {
      diffFilter.addEventListener('change', (e) => {
        this.filterProblems(e.target.value);
      });
    }

    // Action buttons
    const clearAllBtn = document.getElementById('clearAll');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllProblems();
      });
    }

    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }
  }

  async loadData() {
    try {
      // Load daily reviews
      const reviews = await this.sendMessage('GET_DAILY_REVIEWS');
      this.dailyReviews = reviews || [];

      // Load all problems
      const problems = await this.sendMessage('GET_ALL_PROBLEMS');
      this.allProblems = problems || [];

      // Update stats
      const totalProblemsBadge = document.getElementById('totalProblemsBadge');
      if (totalProblemsBadge) totalProblemsBadge.textContent = this.allProblems.length;
      const reviewCountElem = document.getElementById('reviewCount');
      if (reviewCountElem) reviewCountElem.textContent = this.dailyReviews.length;
      // Set loading to false and render
      this.isLoading = false;
      this.render();
    } catch (error) {
      if (error && error.message) {
        console.error('Error loading data:', error.message, error.stack);
      } else {
        try {
          console.error('Error loading data:', JSON.stringify(error));
        } catch (e) {
          console.error('Error loading data:', error);
        }
      }
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabName);
    });

    this.currentTab = tabName;
    this.render();
  }

  render() {
    if (this.currentTab === 'reviews') {
      this.renderReviews();
    } else {
      this.renderAllProblems();
    }
  }

  renderReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    if (this.dailyReviews.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No problems due for review today!</p>
          <p class="subtitle">Keep solving problems on LeetCode to build your review queue.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.dailyReviews.map(problem => this.createProblemCard(problem, true)).join('');
  }

  renderAllProblems() {
    const container = document.getElementById('allProblemsList');
    if (!container) return;
    
    if (this.allProblems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No problems saved yet!</p>
          <p class="subtitle">Solve problems on LeetCode to start building your spaced repetition system.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.allProblems.map(problem => this.createProblemCard(problem, false)).join('');
  }

  createProblemCard(problem, isReview = false) {
    const difficultyClass = problem.difficulty ? problem.difficulty.toLowerCase() : 'medium';
    const nextReviewDate = problem.nextReview ? new Date(problem.nextReview).toLocaleString() : 'Not scheduled';
    const timeSpent = this.formatTime(problem.timeSpent);
    
    return `
      <div class="problem-card">
        <div class="problem-title-top">
          <a href="#" class="problem-title open-problem-btn" data-url="${problem.url}"><strong>${problem.title || '(No Title)'}</strong></a>
        </div>
        <div class="problem-header">
          <span class="difficulty-badge ${difficultyClass}">${problem.difficulty || 'Unknown'}</span>
        </div>
        
        <div class="problem-meta">
          <span>Solved: ${problem.solveCount || 1} time(s)</span>
          <span>Time: ${timeSpent}</span>
        </div>
        
        ${isReview ? `
          <div class="problem-meta">
            <span>Last reviewed: ${problem.lastReviewed ? new Date(problem.lastReviewed).toLocaleDateString() : 'Never'}</span>
            <span>Reviews: ${problem.reviewCount || 0}</span>
          </div>
        ` : `
          <div class="problem-meta">
            <span>Next review: ${nextReviewDate}</span>
            <span>Reviews: ${problem.reviewCount || 0}</span>
          </div>
        `}
        
        <div class="problem-actions">
          ${isReview ? `
            <button class="btn btn-primary mark-reviewed-btn" data-problem-id="${problem.id || problem.url}">
              Mark Reviewed
            </button>
            <button class="btn btn-primary open-problem-btn" data-url="${problem.url}">
              Open Problem
            </button>
          ` : `
            <button class="btn btn-primary open-problem-btn" data-url="${problem.url}">
              Open Problem
            </button>
          `}
          <button class="btn btn-danger delete-btn" data-problem-id="${problem.id || problem.url}">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  filterProblems(difficulty) {
    const container = document.getElementById('allProblemsList');
    const filteredProblems = difficulty 
      ? this.allProblems.filter(p => p.difficulty === difficulty)
      : this.allProblems;

    if (filteredProblems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No ${difficulty ? difficulty.toLowerCase() : ''} problems found!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredProblems.map(problem => this.createProblemCard(problem, false)).join('');
  }

  async markAsReviewed(problemId) {
    console.log('[SR][popup] Marking as reviewed:', problemId);
    
    try {
      const success = await this.sendMessage('MARK_REVIEWED', { problemId });
      if (success) {
        await this.loadData();
        this.render();
      }
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  }

  async deleteProblem(problemId) {
    console.log('[SR][popup] Attempting to delete:', problemId);
    
    if (!confirm('Are you sure you want to delete this problem?')) {
      return;
    }
    
    try {
      const success = await this.sendMessage('DELETE_PROBLEM', { problemId });
      if (success) {
        await this.loadData();
        this.render();
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
    }
  }

  async clearAllProblems() {
    if (!confirm('Are you sure you want to delete ALL problems? This action cannot be undone.')) {
      return;
    }

    try {
      await this.sendMessage('CLEAR_ALL_PROBLEMS');
      await this.loadData();
      this.render();
      document.getElementById('totalProblems').textContent = '0';
      document.getElementById('reviewCount').textContent = '0';
    } catch (error) {
      console.error('Error clearing problems:', error);
    }
  }

  async exportData() {
    try {
      const data = {
        problems: this.allProblems,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `leetcode-spaced-repetition-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }

  openProblem(url) {
    chrome.tabs.create({ url });
  }

  formatTime(milliseconds) {
    if (!milliseconds) return 'Unknown';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async sendMessage(type, data = {}, retry = false) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          if (!retry) {
            // Retry once after 200ms if background is cold
            setTimeout(() => {
              this.sendMessage(type, data, true).then(resolve).catch(reject);
            }, 200);
          } else {
            // Show a user-friendly error in the UI
            const container = document.querySelector('.tab-content');
            if (container) {
              container.innerHTML = `<div style='color:#c00;text-align:center;padding:40px 0;'>
                <b>Failed to load data.<br>Please close and reopen the popup.</b>
              </div>`;
            }
            resolve(null);
          }
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup
let popupManager;
document.addEventListener('DOMContentLoaded', () => {
  popupManager = new PopupManager();
});

// Add event listeners for dynamic content
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const problemId = e.target.getAttribute('data-problem-id');
    popupManager.deleteProblem(problemId);
  }
  
  if (e.target.classList.contains('mark-reviewed-btn')) {
    const problemId = e.target.getAttribute('data-problem-id');
    popupManager.markAsReviewed(problemId);
  }
  
  if (e.target.classList.contains('open-problem-btn')) {
    e.preventDefault();
    const url = e.target.getAttribute('data-url');
    if (url) popupManager.openProblem(url);
  }
}); 