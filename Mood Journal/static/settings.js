// js/settings.js
document.addEventListener('DOMContentLoaded', () => {
  const themeButton = document.getElementById('toggle-theme');
  const profileForm = document.getElementById('profile-form');
  const exportButton = document.getElementById('export-data');
  const clearButton = document.getElementById('clear-data');

  // Toggle theme
  themeButton.addEventListener('click', () => {
    toggleTheme();
  });

  // Handle profile update
  profileForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    alert(`Profile updated!\nName: ${username}\nEmail: ${email}`);
  });

  // Export data
  exportButton.addEventListener('click', () => {
    alert('Your journal data has been exported.');
  });

  // Clear all data
  clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data?')) {
      localStorage.clear();
      alert('All data has been cleared.');
    }
  });
});
