const backendUrl = 'http://localhost:5000';
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const uploadPopup = document.getElementById('uploadPopup');
const mediaInput = document.getElementById('mediaInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const hideNameAndPfpCheckbox = document.getElementById('hideNameAndPfp');
const contextMenu = document.getElementById('contextMenu');

let hideNameAndPfp = false;
let lastMessageUsername = null;
let selectedMessageId = null;

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:5000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.action === 'delete') {
    removeMessageFromChat(message.id); // Remove the deleted message from the UI
  } else {
    addMessageToChat(message); // Add or update the message in the UI
  }
};

// Add a message to the chat UI
function addMessageToChat(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.dataset.messageId = message.id;

  // Add right-click event for context menu
  messageElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, message.id);
  });

  let content = '';
  if (message.mediaUrl) {
    const fullMediaUrl = `${backendUrl}${message.mediaUrl}`;
    if (message.mediaUrl.endsWith('.mp4') || message.mediaUrl.endsWith('.webm')) {
      content = `
        <div class="media-message">
          ${hideNameAndPfp || message.username === lastMessageUsername ? '' : `
            <div class="username">
              <img src="${message.profilePicture}" class="profile-pic" alt="Profile Picture">
              ${message.username}
            </div>
          `}
          <video controls>
            <source src="${fullMediaUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <a href="${fullMediaUrl}" download="${message.mediaUrl.split('/').pop()}">Download</a>
        </div>
      `;
    } else {
      content = `
        <div class="media-message">
          ${hideNameAndPfp || message.username === lastMessageUsername ? '' : `
            <div class="username">
              <img src="${message.profilePicture}" class="profile-pic" alt="Profile Picture">
              ${message.username}
            </div>
          `}
          <img src="${fullMediaUrl}" alt="Media">
          <a href="${fullMediaUrl}" download="${message.mediaUrl.split('/').pop()}">Download</a>
        </div>
      `;
    }
  } else if (message.text) {
    content = `
      <div class="message-content">
        ${hideNameAndPfp || message.username === lastMessageUsername ? '' : `
          <div class="username">
            <img src="${message.profilePicture}" class="profile-pic" alt="Profile Picture">
            ${message.username}
          </div>
        `}
        <p>${message.text}</p>
      </div>
    `;
  }

  messageElement.innerHTML = content;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
  lastMessageUsername = message.username; // Update last message username
}

// Toggle hiding name and profile picture
function toggleNameAndPfp() {
  hideNameAndPfp = hideNameAndPfpCheckbox.checked;
  fetchMessages(); // Refresh messages to apply changes
}

// Show context menu on right-click
function showContextMenu(e, messageId) {
  selectedMessageId = messageId;
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;
}

// Hide context menu
window.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

// Edit a message
async function editMessage() {
  const newText = prompt('Edit your message:');
  if (newText) {
    try {
      const response = await fetch(`${backendUrl}/messages/${selectedMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        updateMessageInChat(updatedMessage); // Update the message in the chat UI
      } else {
        alert('Failed to edit message.');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }
}

// Delete a message
async function deleteMessage() {
  if (confirm('Are you sure you want to delete this message?')) {
    try {
      const response = await fetch(`${backendUrl}/messages/${selectedMessageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        removeMessageFromChat(selectedMessageId); // Remove the message from the chat UI
      } else {
        alert('Failed to delete message.');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }
}

// Helper function to update a message in the chat UI
function updateMessageInChat(message) {
  const messageElement = document.querySelector(`.message[data-message-id="${message.id}"]`);
  if (messageElement) {
    const textElement = messageElement.querySelector('.message-content p');
    if (textElement) {
      textElement.textContent = message.text;
    }
  }
}

// Helper function to remove a message from the chat UI
function removeMessageFromChat(messageId) {
  const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
  if (messageElement) {
    messageElement.remove();
  }
}

// Load messages on page load
fetchMessages();

// Send message on Enter key press
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Close upload popup when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === uploadPopup) {
    closeUploadPopup();
  }
});
