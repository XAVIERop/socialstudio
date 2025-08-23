// AI Dual-Mode Functionality
// This script handles the dual-mode behavior for AI pages:
// - Public Mode: Shows demo content and login/signup buttons
// - Logged-in Mode: Shows full functionality and user menu

let isLoggedIn = false;
let userData = null;

// Check authentication status on page load
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  userData = JSON.parse(localStorage.getItem('userData'));
  
  if (token && userData) {
    isLoggedIn = true;
    showLoggedInMode();
  } else {
    isLoggedIn = false;
    showPublicMode();
  }
}

// Show logged-in user mode
function showLoggedInMode() {
  // Show user menu
  const userMenu = document.getElementById('userMenuContainer');
  if (userMenu) userMenu.classList.remove('hidden');
  
  // Hide auth buttons
  const authButtons = document.getElementById('authButtonsContainer');
  if (authButtons) authButtons.classList.add('hidden');
  
  // Hide public CTA
  const publicCTA = document.getElementById('publicCTA');
  if (publicCTA) publicCTA.classList.add('hidden');
  
  // Hide demo notice
  const demoNotice = document.getElementById('demoNotice');
  if (demoNotice) demoNotice.classList.add('hidden');
  
  // Ensure all interactive content is visible for logged-in users too
  const interactiveSections = document.querySelectorAll('[data-aos]');
  interactiveSections.forEach(section => {
    section.classList.remove('hidden');
  });
  
  // Show all content sections
  const demoContent = document.querySelectorAll('.bg-white.rounded-2xl');
  demoContent.forEach(content => {
    content.classList.remove('hidden');
  });
  
  // Load user data
  const userName = document.getElementById('userName');
  if (userName && userData) userName.textContent = userData.name;
}

// Show public demo mode
function showPublicMode() {
  // Hide user menu
  const userMenu = document.getElementById('userMenuContainer');
  if (userMenu) userMenu.classList.add('hidden');
  
  // Show auth buttons
  const authButtons = document.getElementById('authButtonsContainer');
  if (authButtons) authButtons.classList.remove('hidden');
  
  // Show public CTA
  const publicCTA = document.getElementById('publicCTA');
  if (publicCTA) publicCTA.classList.remove('hidden');
  
  // Show demo notice
  const demoNotice = document.getElementById('demoNotice');
  if (demoNotice) demoNotice.classList.remove('hidden');
  
  // Ensure all interactive demo content is visible
  const interactiveSections = document.querySelectorAll('[data-aos]');
  interactiveSections.forEach(section => {
    section.classList.remove('hidden');
  });
  
  // Show all demo content sections
  const demoContent = document.querySelectorAll('.bg-white.rounded-2xl');
  demoContent.forEach(content => {
    content.classList.remove('hidden');
  });
}

// Handle quick actions based on auth status
function handleQuickAction(action) {
  if (!isLoggedIn) {
    // Show demo or redirect to signup
    switch(action) {
      case 'analyze':
        showDemoAnalysis();
        break;
      case 'competitors':
        alert('Competitor analysis feature coming soon! Sign up to get early access.');
        break;
      case 'report':
        alert('Report generation feature coming soon! Sign up to get early access.');
        break;
      case 'workflow':
        alert('Create real workflows when you sign up for a free account.');
        break;
      case 'chatbot':
        alert('Deploy your own AI chatbot when you sign up for a free account.');
        break;
    }
  } else {
    // Handle for logged-in users
    switch(action) {
      case 'analyze':
        const urlInput = document.getElementById('websiteUrl');
        if (urlInput) urlInput.focus();
        break;
      case 'competitors':
        alert('Competitor analysis feature coming soon!');
        break;
      case 'report':
        alert('Report generation feature coming soon!');
        break;
      case 'workflow':
        // Show workflow builder
        break;
      case 'chatbot':
        // Show chatbot configuration
        break;
    }
  }
}

// Show demo analysis for non-logged users
function showDemoAnalysis() {
  // Hide input form
  const inputForm = document.getElementById('websiteUrl');
  if (inputForm) {
    const formContainer = inputForm.closest('.mb-8');
    if (formContainer) formContainer.classList.add('hidden');
  }
  
  // Show demo results
  const demoResults = document.getElementById('demoResults');
  if (demoResults) demoResults.classList.remove('hidden');
}

// Logout function
function logout() {
  localStorage.removeItem('userData');
  localStorage.removeItem('token');
  checkAuthStatus();
  
  // Redirect to home page
  window.location.href = 'index.html';
}

// Initialize dual-mode functionality
function initDualMode() {
  // Check auth status
  checkAuthStatus();
  
  // Add event listeners for user menu
  const userMenuButton = document.getElementById('userMenuButton');
  if (userMenuButton) {
    userMenuButton.addEventListener('click', function () {
      const dropdown = document.getElementById('userDropdown');
      if (dropdown) {
        dropdown.classList.toggle("opacity-0");
        dropdown.classList.toggle("invisible");
      }
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const button = document.getElementById('userMenuButton');
    
    if (dropdown && button && !button.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.add("opacity-0", "invisible");
    }
  });
}

// Export functions for use in other scripts
window.AIDualMode = {
  checkAuthStatus,
  showLoggedInMode,
  showPublicMode,
  handleQuickAction,
  showDemoAnalysis,
  logout,
  initDualMode,
  isLoggedIn: () => isLoggedIn,
  userData: () => userData
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDualMode);
