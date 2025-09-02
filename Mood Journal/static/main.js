// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  loadTheme();
});

// Highlight the current page in nav
function highlightActiveNav() {
  const links = document.querySelectorAll('nav ul li a');
  const currentPage = window.location.pathname.split('/').pop();
  links.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === currentPage);
  });
}

// Load and apply theme from localStorage
function loadTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', theme === 'dark');
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
