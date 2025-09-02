// dashboard.js - Updated to connect with MySQL via Flask API

// ----------------------------
// 1. Initialize Dashboard
// ----------------------------
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadMoodChart();
    loadRecentEntries();
});

// ----------------------------
// 2. Load Dashboard Summary Data
// ----------------------------
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard-summary');
        if (!response.ok) {
            console.error('Error fetching dashboard data: HTTP', response.status);
            showDemoData();
            return;
        }
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading dashboard data:', data.error);
            return;
        }
        
        // Update summary cards
        document.getElementById('entries-week').textContent = data.entries_week;
        document.getElementById('common-mood').textContent = data.common_mood;
        document.getElementById('streak').textContent = `${data.streak} days`;
        document.getElementById('days-logged').textContent = data.days_logged;
        
        // Update progress bar (assuming 31 days in month)
        const progressPercentage = (data.days_logged / 31) * 100;
        document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to demo data if API fails
        showDemoData();
    }
}

// ----------------------------
// 3. Load Mood Chart
// ----------------------------
let moodChart = null;

async function loadMoodChart() {
    try {
        const response = await fetch('/api/mood-trends');
        const trendData = await response.json();
        
        if (trendData.error) {
            console.error('Error loading mood trends:', trendData.error);
            return;
        }
        
        const ctx = document.getElementById('moodChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (moodChart) {
            moodChart.destroy();
        }
        
        moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Mood Levels',
                    data: trendData.data,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const moods = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Happy'];
                                return `Mood: ${moods[Math.round(value) - 1] || 'No data'} (${value})`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function (value) {
                                const moods = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Happy'];
                                return moods[value - 1] || value;
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading mood chart:', error);
        // Fallback to demo chart if API fails
        showDemoChart();
    }
}

// ----------------------------
// 4. Load Recent Entries
// ----------------------------
async function loadRecentEntries() {
    try {
        const response = await fetch('/api/recent-entries');
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading recent entries:', data.error);
            return;
        }
        
        const entriesList = document.getElementById('entries-list');
        entriesList.innerHTML = ''; // Clear existing entries
        
        if (data.entries.length === 0) {
            entriesList.innerHTML = '<li>No entries yet. <a href="/entry">Create your first entry!</a></li>';
            return;
        }
        
        data.entries.forEach(entry => {
            const li = document.createElement('li');
            const preview = entry.entry_text.length > 60 
                ? entry.entry_text.substring(0, 60) + '...' 
                : entry.entry_text;
            
            li.innerHTML = `
                <strong>${entry.formatted_date}:</strong> 
                ${preview} 
                <span class="mood-indicator">(${entry.mood || 'No mood'})</span>
            `;
            entriesList.appendChild(li);
        });
        
    } catch (error) {
        console.error('Error loading recent entries:', error);
        showDemoEntries();
    }
}

// ----------------------------
// 5. Fallback Demo Data Functions
// ----------------------------
function showDemoData() {
    document.getElementById('entries-week').textContent = '3';
    document.getElementById('common-mood').textContent = 'Loading...';
    document.getElementById('streak').textContent = '0 days';
    document.getElementById('days-logged').textContent = '0';
}

function showDemoChart() {
    const ctx = document.getElementById('moodChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Mood Levels (Demo)',
                data: [3, 4, 2, 5, 4, 3, 5],
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            const moods = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Happy'];
                            return moods[value - 1] || value;
                        }
                    }
                }
            }
        }
    });
}

function showDemoEntries() {
    const entriesList = document.getElementById('entries-list');
    entriesList.innerHTML = `
        <li><strong>Demo:</strong> Connect to database to see real entries.</li>
        <li><strong>Note:</strong> Make sure MySQL is running and database is set up.</li>
    `;
}

// ----------------------------
// 6. Utility Functions
// ----------------------------
function refreshDashboard() {
    loadDashboardData();
    loadMoodChart();
    loadRecentEntries();
}

// Optional: Auto-refresh every 5 minutes
setInterval(refreshDashboard, 300000);