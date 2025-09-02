// home.js

// Display a personalized welcome message based on time
const heroHeading = document.querySelector('.hero h1');
const hours = new Date().getHours();

let greeting;
if (hours < 12) {
  greeting = 'Good Morning';
} else if (hours < 18) {
  greeting = 'Good Afternoon';
} else {
  greeting = 'Good Evening';
}

heroHeading.innerHTML = `${greeting}, Welcome to <span class="highlight">Mood Journal</span>`;

// Track number of visits using localStorage
let visits = parseInt(localStorage.getItem('visits') || '0', 10);
visits += 1;
localStorage.setItem('visits', visits);

// Show an alert for first-time visitors
if (visits === 1) {
  alert('Welcome to Mood Journal! Start by logging your first entry.');
}

// Add a subtle hover animation for the Start Journaling button
const startBtn = document.querySelector('.primary-btn');
startBtn.addEventListener('mouseover', () => {
  startBtn.style.transform = 'scale(1.05)';
  startBtn.style.transition = 'transform 0.3s ease';
});
startBtn.addEventListener('mouseout', () => {
  startBtn.style.transform = 'scale(1)';
});
