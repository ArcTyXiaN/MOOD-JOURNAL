const journalForm = document.getElementById('journal-form');
const journalText = document.getElementById('journal-text');
const tagsInput = document.getElementById('tags');
const moodScale = document.getElementById('mood-scale');
const emotionCard = document.getElementById('emotion-card');
const moodOutput = document.getElementById('mood');
const confidenceOutput = document.getElementById('confidence');

// Add loading state management
function setLoading(isLoading) {
  const submitButton = journalForm.querySelector('button[type="submit"]');
  if (isLoading) {
    submitButton.textContent = 'Analyzing...';
    submitButton.disabled = true;
  } else {
    submitButton.textContent = 'Submit Entry';
    submitButton.disabled = false;
  }
}

journalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate input
  const textValue = journalText.value.trim();
  if (!textValue) {
    alert('Please write something in your journal entry.');
    return;
  }

  console.log('Form submission started'); // Debug log
  setLoading(true);

  try {
    // Create FormData object
    const data = new FormData();
    data.append('journal_text', textValue);
    data.append('tags', tagsInput.value.trim());
    data.append('mood_scale', moodScale.value);

    console.log('Sending data:', {
      journal_text: textValue,
      tags: tagsInput.value.trim(),
      mood_scale: moodScale.value
    }); // Debug log

    const response = await fetch('/entry', {
      method: 'POST',
      body: data
    });

    console.log('Response status:', response.status); // Debug log
    console.log('Response headers:', response.headers.get('content-type')); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Result:', result); // Debug log

    if (result.success) {
      // Show the emotion analysis
      emotionCard.classList.remove('hidden');
      moodOutput.textContent = result.mood;
      confidenceOutput.textContent = `${result.confidence}%`;

      // Clear the form
      journalText.value = '';
      tagsInput.value = '';
      moodScale.value = '5';
      
      // Show success message
      showSuccessMessage('Your entry has been saved successfully!');
      
      // Optional: Redirect to dashboard after 3 seconds
      setTimeout(() => {
        if (confirm('Entry saved! Would you like to view your dashboard?')) {
          window.location.href = '/dashboard';
        }
      }, 3000);
      
    } else {
      throw new Error(result.error || 'Unknown error occurred');
    }

  } catch (error) {
    console.error('Error submitting entry:', error);
    showErrorMessage(`Error saving entry: ${error.message}. Please try again.`);
  } finally {
    setLoading(false);
  }
});

// Utility functions for user feedback
function showSuccessMessage(message) {
  const existingMessage = document.querySelector('.success-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    background: #4caf50;
    color: white;
    padding: 1rem;
    border-radius: 5px;
    margin: 1rem 0;
    text-align: center;
  `;
  
  journalForm.parentNode.insertBefore(successDiv, journalForm);
  
  // Remove after 5 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 5000);
}

function showErrorMessage(message) {
  const existingMessage = document.querySelector('.error-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    background: #f44336;
    color: white;
    padding: 1rem;
    border-radius: 5px;
    margin: 1rem 0;
    text-align: center;
  `;
  
  journalForm.parentNode.insertBefore(errorDiv, journalForm);
  
  // Remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Update mood scale display
moodScale.addEventListener('input', function() {
  const value = this.value;
  const moodLabels = {
    1: 'Very Low', 2: 'Low', 3: 'Low', 4: 'Below Average', 5: 'Average',
    6: 'Above Average', 7: 'Good', 8: 'Good', 9: 'Very Good', 10: 'Excellent'
  };
  
  // Create or update mood scale display
  let display = document.getElementById('mood-scale-display');
  if (!display) {
    display = document.createElement('span');
    display.id = 'mood-scale-display';
    display.style.cssText = 'margin-left: 1rem; font-weight: bold; color: #4a90e2;';
    this.parentNode.appendChild(display);
  }
  
  display.textContent = `${value}/10 - ${moodLabels[value]}`;
});