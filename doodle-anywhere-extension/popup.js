// popup.js - Controls the extension popup interface

document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startDoodle');
  const stopBtn = document.getElementById('stopDoodle');
  const statusDiv = document.getElementById('status');

  // Check current doodle status when popup opens
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'CHECK_STATUS'}, function(response) {
      if (chrome.runtime.lastError) {
        // Content script not loaded yet, show inactive status
        updateStatus(false);
      } else if (response && response.isActive) {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    });
  });

  // Start doodling button
  startBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'START_DOODLE'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error starting doodle:', chrome.runtime.lastError);
          showError('Failed to start doodle mode. Please refresh the page and try again.');
        } else {
          updateStatus(true);
          // Add a small delay before closing so user sees the status change
          setTimeout(() => {
            window.close();
          }, 500);
        }
      });
    });
  });

  // Stop doodling button
  stopBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'STOP_DOODLE'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error stopping doodle:', chrome.runtime.lastError);
        } else {
          updateStatus(false);
          // Add a small delay before closing so user sees the status change
          setTimeout(() => {
            window.close();
          }, 500);
        }
      });
    });
  });

  // Update status display
  function updateStatus(isActive) {
    statusDiv.className = 'status';
    
    if (isActive) {
      statusDiv.classList.add('active');
      statusDiv.innerHTML = '🎨 Doodle mode is <strong>ACTIVE</strong>';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
    } else {
      statusDiv.classList.add('inactive');
      statusDiv.innerHTML = '🚫 Doodle mode is <strong>INACTIVE</strong>';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
    }
  }

  // Show error message
  function showError(message) {
    statusDiv.className = 'status inactive';
    statusDiv.innerHTML = '⚠️ ' + message;
  }

  // Add keyboard shortcuts info
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      if (startBtn.style.display !== 'none') {
        startBtn.click();
      } else {
        stopBtn.click();
      }
    } else if (e.key === 'Escape') {
      window.close();
    }
  });
});