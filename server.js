<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account</title>
    <style>
        /* Your existing CSS styles */
    </style>
</head>
<body>
    <!-- Left Box (Sidebar) -->
    <div class="left-box" id="leftBox">
        <div class="icon search" onclick="window.location.href = '/'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span class="icon-text">Home</span>
        </div>
        <div class="icon community-games" onclick="window.location.href = '/community.html'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                <circle cx="9" cy="9" r="1.5" />
                <circle cx="15" cy="9" r="1.5" />
                <path d="M12 16c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
            </svg>
            <span class="icon-text">Community Games</span>
        </div>
        <div class="icon account active" onclick="window.location.href = '/account.html'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            <span class="icon-text">Account</span>
        </div>
        <div class="icon public-profile" onclick="window.location.href = '/thepool.html'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            <span class="icon-text">The pool</span>
        </div>
    </div>

    <!-- Right Box (Main Content) -->
    <div class="right-box" id="rightBox">
        <!-- Top Bar -->
        <div class="top-bar">
            <img class="profile-picture" id="profilePictureTop" src="https://via.placeholder.com/150" alt="Profile Picture" onclick="handleProfileClick()">
        </div>

        <!-- Account Content -->
        <div class="account-content">
            <!-- Greeting Section -->
            <div class="greeting">
                <img id="profilePicture" src="https://via.placeholder.com/150" alt="Profile Picture">
                <h2>Hello, <span id="username"></span>!</h2>
            </div>

            <!-- Account Settings Section -->
            <div class="section">
                <h3>Settings</h3>
                <ul>
                    <li><a href="#" onclick="openChangeProfilePictureModal()">Change Profile Picture</a></li>
                    <li><a href="#" onclick="logout()">Log Out</a></li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Sign-In Modal -->
    <div class="modal" id="signInModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeSignInModal()">×</button>
            <h2 id="authTitle">Sign In</h2>
            <div class="input-container">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <input type="text" id="usernameInput" placeholder="Username" required maxlength="18">
            </div>
            <div class="input-container">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M22 9h-2V7c0-2.76-2.24-5-5-5S10 4.24 10 7v2H2v11h20V9zm-4 0h-6V7c0-1.1.9-2 2-2s2 .9 2 2v2z"/>
                </svg>
                <input type="password" id="passwordInput" placeholder="Password" required>
                <span class="toggle-password" onclick="togglePasswordVisibility()">
                    <svg class="eye-icon encrypted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                </span>
            </div>
            <div id="profilePictureContainer" style="display: none;">
                <input type="url" id="profilePictureInput" placeholder="Profile Picture URL (optional)">
            </div>
            <button id="authButton">Sign In</button>
            <div class="switch" id="switchAuth">Don't have an account? Sign Up</div>
        </div>
    </div>

    <!-- Change Profile Picture Modal -->
    <div class="modal" id="changeProfilePictureModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeChangeProfilePictureModal()">×</button>
            <h2>Change Profile Picture</h2>
            <input type="url" id="newProfilePicture" placeholder="New Profile Picture URL" required>
            <button class="button" onclick="changeProfilePicture()">Confirm</button>
        </div>
    </div>

    <script>
        const backendUrl = 'http://localhost:5000'; // Update this if your backend is hosted elsewhere
        let isSignIn = true;

        // Handle Profile Picture Click
        function handleProfileClick() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                window.location.href = '/account.html';
            } else {
                openSignInModal();
            }
        }

        // Open Sign-In Modal
        function openSignInModal() {
            document.getElementById('signInModal').style.display = 'flex';
        }

        // Close Sign-In Modal
        function closeSignInModal() {
            document.getElementById('signInModal').style.display = 'none';
        }

        // Open Change Profile Picture Modal
        function openChangeProfilePictureModal() {
            document.getElementById('changeProfilePictureModal').style.display = 'flex';
        }

        // Close Change Profile Picture Modal
        function closeChangeProfilePictureModal() {
            document.getElementById('changeProfilePictureModal').style.display = 'none';
        }

        // Toggle Password Visibility
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('passwordInput');
            const eyeIcon = document.querySelector('.eye-icon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('encrypted');
                eyeIcon.setAttribute('fill', 'white');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.add('encrypted');
                eyeIcon.setAttribute('fill', '#888');
            }
        }

        // Validate Username Length
        function validateUsername() {
            const usernameInput = document.getElementById('usernameInput');
            if (usernameInput.value.length > 18) {
                alert('Username must be 18 characters or less.');
                usernameInput.value = usernameInput.value.slice(0, 18);
            }
        }

        // Add Event Listener for Username Input
        document.getElementById('usernameInput').addEventListener('input', validateUsername);

        // Switch between Sign In and Sign Up
        document.getElementById('switchAuth').addEventListener('click', () => {
            isSignIn = !isSignIn;
            const authTitle = document.getElementById('authTitle');
            const authButton = document.getElementById('authButton');
            const switchAuth = document.getElementById('switchAuth');
            const profilePictureContainer = document.getElementById('profilePictureContainer');

            if (isSignIn) {
                authTitle.innerText = 'Sign In';
                authButton.innerText = 'Sign In';
                switchAuth.innerText = "Don't have an account? Sign Up";
                profilePictureContainer.style.display = 'none';
            } else {
                authTitle.innerText = 'Sign Up';
                authButton.innerText = 'Sign Up';
                switchAuth.innerText = "Already have an account? Sign In";
                profilePictureContainer.style.display = 'block';
            }
        });

        // Handle Sign In / Sign Up
        document.getElementById('authButton').addEventListener('click', async () => {
            const username = document.getElementById('usernameInput').value;
            const password = document.getElementById('passwordInput').value;
            const profilePicture = document.getElementById('profilePictureInput').value || 'https://via.placeholder.com/150';

            if (!username || !password) {
                alert('Please fill in all fields.');
                return;
            }

            const endpoint = isSignIn ? '/login' : '/register';
            const body = isSignIn ? { username, password } : { username, password, profilePicture };

            try {
                const response = await fetch(`${backendUrl}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    updateUI(user);
                    closeSignInModal();
                } else {
                    const error = await response.json();
                    alert(error.error || 'An error occurred. Please try again.');
                }
            } catch (error) {
                alert('Network error. Please check your connection.');
            }
        });

        // Change Profile Picture
        async function changeProfilePicture() {
            const newProfilePicture = document.getElementById('newProfilePicture').value;
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));

            if (!newProfilePicture) {
                alert('Please enter a new profile picture URL.');
                return;
            }

            try {
                const response = await fetch(`${backendUrl}/users/${currentUser.id}/profilePicture`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profilePicture: newProfilePicture }),
                });

                if (response.ok) {
                    const updatedUser = { ...currentUser, profilePicture: newProfilePicture };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    document.getElementById('profilePicture').src = newProfilePicture;
                    document.getElementById('profilePictureTop').src = newProfilePicture;
                    closeChangeProfilePictureModal();
                    alert('Profile picture changed successfully!');
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to update profile picture.');
                }
            } catch (error) {
                alert('Network error. Please check your connection.');
            }
        }

        // Log Out
        function logout() {
            localStorage.removeItem('currentUser');
            window.location.reload();
        }

        // Update UI with User Data
        function updateUI(user) {
            document.getElementById('username').innerText = user.username;
            document.getElementById('profilePicture').src = user.profilePicture;
            document.getElementById('profilePictureTop').src = user.profilePicture;
        }

        // Load user data on page load
        window.onload = () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));

            if (currentUser) {
                updateUI(currentUser);
            } else {
                openSignInModal();
            }
        };
    </script>
</body>
</html>
