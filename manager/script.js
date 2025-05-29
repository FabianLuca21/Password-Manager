// Passwort-Manager Funktionalität
class PasswordManager {
    constructor() {
        this.passwords = [];
        this.settings = this.loadSettings();
        this.currentUser = null;
        
        this.form = document.getElementById('addPasswordForm');
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchInput');
        this.filterSelect = document.getElementById('categoryFilter');
        this.sortBtn = document.querySelector('.sort-btn');
        this.mainContent = document.getElementById('mainContent');
        
        // Initialize section elements
        this.sections = {
            dashboard: document.getElementById('dashboard'),
            addPassword: document.getElementById('addPassword'),
            settings: document.getElementById('settings'),
            profile: document.getElementById('profile')
        };
        
        this.sortDirection = 'asc';
        this.init();
    }

    init() {

        const user = localStorage.getItem('currentUser');
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = JSON.parse(user);


        this.loadPasswords();
        

        this.initEventListeners();
        this.showSection('dashboard');
        this.updateStats();
        this.applySettings();
    }

    showSection(sectionId) {

        Object.values(this.sections).forEach(section => {
            if (section) {
                section.style.display = 'none';
            }
        });


        const navLinks = document.querySelectorAll('.nav-links li');
        navLinks.forEach(link => link.classList.remove('active'));


        const selectedSection = this.sections[sectionId];
        if (selectedSection) {
            selectedSection.style.display = 'block';
            

            const activeLink = document.querySelector(`.nav-links li[data-section="${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            switch(sectionId) {
                case 'dashboard':
                    this.renderPasswords();
                    this.updateStats();
                    break;
                case 'addPassword':
                    if (this.form) this.form.reset();
                    break;
                case 'settings':
                    this.renderSettings();
                    break;
                case 'profile':
                    this.editProfile();
                    break;
            }
        }
    }

    initEventListeners() {

        const navLinks = document.querySelectorAll('.nav-links li');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });


        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('profile');
            });
        }


        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPassword();
            });
        }


        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.renderPasswords());
        }

        if (this.filterSelect) {
            this.filterSelect.addEventListener('change', () => {
                const selectedCategory = this.filterSelect.value;
                this.filterByCategory(selectedCategory);
            });
        }

        if (this.sortBtn) {
            this.sortBtn.addEventListener('click', () => this.sortPasswords());
        }

        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateSecurePassword());
        }


        const toggleBtn = document.querySelector('.toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const icon = toggleBtn.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
    }

    loadPasswords() {
        const allPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
        this.passwords = allPasswords.filter(p => p.userId === this.currentUser.id);
    }

    savePasswords() {
        const allPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
        const otherUsersPasswords = allPasswords.filter(p => p.userId !== this.currentUser.id);
        localStorage.setItem('passwords', JSON.stringify([...otherUsersPasswords, ...this.passwords]));
    }

    addPassword() {
        const website = document.getElementById('website')?.value;
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        const category = document.getElementById('category')?.value;

        if (!website || !username || !password || !category) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const newPassword = {
            id: Date.now(),
            userId: this.currentUser.id,
            website,
            username,
            password,
            category,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.passwords.push(newPassword);
        this.savePasswords();
        this.renderPasswords();
        this.updateStats();
        this.form.reset();
        this.showNotification('Password saved successfully', 'success');
    }

    deletePassword(id) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Delete Password</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this password?</p>
                    <p class="warning-text">
                        <i class="fas fa-exclamation-circle"></i>
                        This action cannot be undone.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary cancel-delete">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                    <button class="btn-danger confirm-delete">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        const closeModal = () => {
            modal.style.display = 'none';
            modal.remove();
        };

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('.cancel-delete').addEventListener('click', closeModal);
        modal.querySelector('.confirm-delete').addEventListener('click', () => {
            this.passwords = this.passwords.filter(p => p.id !== id);
            this.savePasswords();
            this.renderPasswords();
            this.updateStats();
            this.showNotification('Password deleted successfully!', 'success');
            closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    editProfile() {
        const profileSection = this.sections.profile;
        if (!profileSection) return;

        profileSection.innerHTML = `
            <div class="profile-section">
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${this.currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="profile-info">
                        <h2>${this.currentUser.name}</h2>
                        <p>${this.currentUser.email}</p>
                    </div>
                </div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <h3>Saved Passwords</h3>
                        <p>${this.passwords.length}</p>
                    </div>
                    <div class="profile-stat">
                        <h3>Categories</h3>
                        <p>${new Set(this.passwords.map(p => p.category)).size}</p>
                    </div>
                    <div class="profile-stat">
                        <h3>Last Update</h3>
                        <p>${this.getLastUpdate()}</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="edit-btn" onclick="passwordManager.showEditProfileForm()">
                        <i class="fas fa-user-edit"></i>
                        Edit Profile
                    </button>
                    <button class="logout-btn" onclick="passwordManager.logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </div>
        `;
    }

    showEditProfileForm() {
        const profileSection = this.sections.profile;
        if (!profileSection) return;

        profileSection.innerHTML = `
            <div class="settings-container">
                <h2>Edit Profile</h2>
                <form id="editProfileForm" class="settings-group">
                    <div class="setting-item">
                        <label for="editName">Name</label>
                        <input type="text" id="editName" value="${this.currentUser.name}" required>
                    </div>
                    <div class="setting-item">
                        <label for="editEmail">E-Mail</label>
                        <input type="email" id="editEmail" value="${this.currentUser.email}" required>
                    </div>
                    <div class="setting-item">
                        <label for="currentPassword">Current Password</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    <div class="setting-item">
                        <label for="newPassword">New Password (optional)</label>
                        <input type="password" id="newPassword">
                    </div>
                    <div class="setting-item">
                        <label for="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword">
                    </div>
                    <div class="settings-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            Save Changes
                        </button>
                        <button type="button" class="btn-secondary" onclick="passwordManager.editProfile()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('editProfileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileChanges();
            });
        }
    }

    getLastUpdate() {
        if (this.passwords.length === 0) return 'No passwords';
        const lastUpdate = new Date(Math.max(...this.passwords.map(p => new Date(p.createdAt))));
        return lastUpdate.toLocaleDateString('en-US');
    }

    saveProfileChanges() {
        const name = document.getElementById('editName').value;
        const email = document.getElementById('editEmail').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;


        if (currentPassword !== this.currentUser.password) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }


        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const emailExists = users.some(user => 
            user.email === email && user.id !== this.currentUser.id
        );

        if (emailExists) {
            this.showNotification('This email is already used', 'error');
            return;
        }


        if (newPassword) {
            if (newPassword !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            if (newPassword.length < 8) {
                this.showNotification('New password must be at least 8 characters long', 'error');
                return;
            }
        }


        const updatedUser = {
            ...this.currentUser,
            name,
            email,
            password: newPassword || currentPassword
        };


        const userIndex = users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
        }


        this.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        this.showNotification('Profile updated successfully', 'success');
        this.editProfile();
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    renderSettings() {
        if (!this.sections.settings) return;

        this.sections.settings.innerHTML = `
            <div class="settings-container">
                <h2>Settings</h2>
                
                <div class="settings-group">
                    <h3>Password Generation</h3>
                    <div class="setting-item">
                        <label for="defaultPasswordLength">Default Password Length:</label>
                        <input type="number" id="defaultPasswordLength" 
                               value="${this.settings.defaultPasswordLength}" min="8" max="32">
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="requireSpecialChars" 
                                   ${this.settings.requireSpecialChars ? 'checked' : ''}>
                            Require Special Characters
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="requireNumbers" 
                                   ${this.settings.requireNumbers ? 'checked' : ''}>
                            Require Numbers
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="requireUppercase" 
                                   ${this.settings.requireUppercase ? 'checked' : ''}>
                            Require Uppercase Letters
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="requireLowercase" 
                                   ${this.settings.requireLowercase ? 'checked' : ''}>
                            Require Lowercase Letters
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>Security</h3>
                    <div class="setting-item">
                        <label for="autoLockTimeout">Auto-Lock Timeout (Minutes):</label>
                        <input type="number" id="autoLockTimeout" 
                               value="${this.settings.autoLockTimeout}" min="1" max="120">
                    </div>
                </div>

                <div class="settings-group">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <label for="theme">Design:</label>
                        <select id="theme">
                            <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                </div>

                <div class="settings-actions">
                    <button id="saveSettings" class="btn-primary">Save Settings</button>
                    <button id="resetSettings" class="btn-secondary">Reset</button>
                </div>
            </div>
        `;


        const saveButton = this.sections.settings.querySelector('#saveSettings');
        const resetButton = this.sections.settings.querySelector('#resetSettings');

        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveSettings());
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetSettings());
        }
    }

    saveSettings() {
        const newSettings = {
            defaultPasswordLength: parseInt(document.getElementById('defaultPasswordLength').value) || 16,
            requireSpecialChars: document.getElementById('requireSpecialChars').checked,
            requireNumbers: document.getElementById('requireNumbers').checked,
            requireUppercase: document.getElementById('requireUppercase').checked,
            requireLowercase: document.getElementById('requireLowercase').checked,
            autoLockTimeout: parseInt(document.getElementById('autoLockTimeout').value) || 30,
            theme: document.getElementById('theme').value,
            language: this.settings.language
        };

        this.settings = newSettings;
        localStorage.setItem('passwordManagerSettings', JSON.stringify(this.settings));
        this.applySettings();
        this.showNotification('Settings saved');
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings?')) {
            this.settings = {
                defaultPasswordLength: 16,
                requireSpecialChars: true,
                requireNumbers: true,
                requireUppercase: true,
                requireLowercase: true,
                autoLockTimeout: 30,
                theme: 'light',
                language: 'en'
            };
            localStorage.setItem('passwordManagerSettings', JSON.stringify(this.settings));
            this.applySettings();
            this.renderSettings();
            this.showNotification('Settings reset');
        }
    }

    applySettings() {

        document.body.className = this.settings.theme;

        if (this.autoLockTimer) {
            clearTimeout(this.autoLockTimer);
        }
        this.autoLockTimer = setTimeout(() => {

            this.showNotification('Session locked automatically', 'info');
        }, this.settings.autoLockTimeout * 60 * 1000);
    }

    generateSecurePassword() {
        const length = this.settings.defaultPasswordLength;
        const charset = {
            lowercase: this.settings.requireLowercase ? "abcdefghijklmnopqrstuvwxyz" : "",
            uppercase: this.settings.requireUppercase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
            numbers: this.settings.requireNumbers ? "0123456789" : "",
            special: this.settings.requireSpecialChars ? "!@#$%^&*()_+-=[]{}|;:,.<>?" : ""
        };

        let password = [];
        let allChars = "";


        if (charset.lowercase) {
            password.push(charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)]);
            allChars += charset.lowercase;
        }
        if (charset.uppercase) {
            password.push(charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)]);
            allChars += charset.uppercase;
        }
        if (charset.numbers) {
            password.push(charset.numbers[Math.floor(Math.random() * charset.numbers.length)]);
            allChars += charset.numbers;
        }
        if (charset.special) {
            password.push(charset.special[Math.floor(Math.random() * charset.special.length)]);
            allChars += charset.special;
        }


        for (let i = password.length; i < length; i++) {
            password.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }


        password = password.sort(() => Math.random() - 0.5).join('');
        
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.value = password;

            passwordInput.type = 'text';
            setTimeout(() => {
                passwordInput.type = 'password';
            }, 2000);
        }
    }

    getCategoryLabel(category) {
        const categories = {
            'social': 'Social Media',
            'email': 'Email',
            'shopping': 'Shopping',
            'banking': 'Banking',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    getCategoryClass(category) {
        return `category-${category}`;
    }

    copyToClipboard(text, type = 'password') {
        if (!text) {
            this.showNotification('No text to copy', 'error');
            return;
        }
        
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        try {
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            const successful = document.execCommand('copy');
            if (successful) {
                const message = type === 'password' ? 'Password copied to clipboard!' : 'Username copied to clipboard!';
                this.showNotification(message);
            } else {
                throw new Error('Copy failed');
            }
        } catch (err) {
            console.error('Error copying:', err);
            this.showNotification('Error copying to clipboard', 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '5px';
        notification.style.color = 'white';
        notification.style.zIndex = '1000';
        notification.style.animation = 'slideIn 0.5s ease-out';
        
        if (type === 'success') {
            notification.style.backgroundColor = '#2ecc71';
        } else {
            notification.style.backgroundColor = '#e74c3c';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    filterPasswords(searchTerm) {
        if (!searchTerm) {
            this.renderPasswords();
            return;
        }

        const filteredPasswords = this.passwords.filter(entry => 
            entry.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderPasswords(filteredPasswords);
    }

    filterByCategory(category) {
        if (!category || category === 'all') {
            this.renderPasswords();
            return;
        }

        const filteredPasswords = this.passwords.filter(entry => entry.category === category);
        this.renderPasswords(filteredPasswords);
    }

    sortPasswords() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        
        const selectedCategory = this.filterSelect.value;
        let passwordsToSort = this.passwords;
        
        if (selectedCategory !== 'all') {
            passwordsToSort = this.passwords.filter(p => p.category === selectedCategory);
        }
        
        passwordsToSort.sort((a, b) => {
            const websiteA = a.website.toLowerCase();
            const websiteB = b.website.toLowerCase();
            
            if (this.sortDirection === 'asc') {
                return websiteA.localeCompare(websiteB);
            } else {
                return websiteB.localeCompare(websiteA);
            }
        });
        
        const sortBtn = document.getElementById('sortBtn');
        sortBtn.classList.toggle('active');
        const icon = sortBtn.querySelector('i');
        icon.style.transform = this.sortDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0)';
        
        this.renderPasswords(passwordsToSort);
        this.showNotification(`Passwords sorted ${this.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
    }

    updateStats() {
        const totalPasswords = document.querySelector('.stat-card:nth-child(1) p');
        const securityStatus = document.querySelector('.stat-card:nth-child(2) p');
        const lastUpdate = document.querySelector('.stat-card:nth-child(3) p');

        // Total Passwords
        if (totalPasswords) {
            totalPasswords.textContent = this.passwords.length;
        }

        // Security Status
        if (securityStatus) {
            const weakPasswords = this.passwords.filter(p => p.password.length < 8).length;
            const veryWeakPasswords = this.passwords.filter(p => p.password.length < 6).length;
            const strongPasswords = this.passwords.filter(p => 
                p.password.length >= 12 && 
                /[A-Z]/.test(p.password) && 
                /[a-z]/.test(p.password) && 
                /[0-9]/.test(p.password) && 
                /[^A-Za-z0-9]/.test(p.password)
            ).length;
            
            let status = 'Good';
            let statusDetails = [];
            
            if (veryWeakPasswords > 0) {
                status = 'Critical';
                statusDetails.push(`⚠️ ${veryWeakPasswords} very weak password${veryWeakPasswords > 1 ? 's' : ''}`);
            } else if (weakPasswords > 0) {
                status = 'Poor';
                statusDetails.push(`⚠️ ${weakPasswords} weak password${weakPasswords > 1 ? 's' : ''}`);
            }
            
            if (strongPasswords > 0) {
                statusDetails.push(`✅ ${strongPasswords} strong password${strongPasswords > 1 ? 's' : ''}`);
            }
            
            const statusText = statusDetails.length > 0 ? 
                `${status}\n${statusDetails.join('\n')}` : 
                status;
                
            securityStatus.innerHTML = statusText.replace(/\n/g, '<br>');
            
            // Update status color
            const statusCard = securityStatus.closest('.stat-card');
            if (statusCard) {
                const icon = statusCard.querySelector('i');
                if (icon) {
                    icon.style.color = 
                        status === 'Good' ? 'var(--success-color)' :
                        status === 'Poor' ? '#f59e0b' : 
                        'var(--danger-color)';
                }
            }
        }

        // Last Update
        if (lastUpdate) {
            if (this.passwords.length === 0) {
                lastUpdate.textContent = '-';
            } else {
                const lastModified = new Date(Math.max(...this.passwords.map(p => new Date(p.lastModified))));
                const now = new Date();
                const diffTime = Math.abs(now - lastModified);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                    if (diffHours === 0) {
                        const diffMinutes = Math.floor(diffTime / (1000 * 60));
                        lastUpdate.textContent = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                    } else {
                        lastUpdate.textContent = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                    }
                } else if (diffDays === 1) {
                    lastUpdate.textContent = 'Yesterday';
                } else if (diffDays < 7) {
                    lastUpdate.textContent = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                } else {
                    lastUpdate.textContent = lastModified.toLocaleDateString('en-US');
                }
            }
        }
    }

    renderPasswords(passwordsToRender = this.passwords) {
        if (!this.passwordList) return;
        
        this.passwordList.innerHTML = '';
        
        if (passwordsToRender.length === 0) {
            this.passwordList.innerHTML = `
                <div class="no-passwords">
                    <i class="fas fa-lock"></i>
                    <p>No passwords found</p>
                </div>
            `;
            return;
        }
        
        passwordsToRender.forEach(entry => {
            const passwordItem = document.createElement('div');
            passwordItem.className = 'password-item';
            
            const safePassword = btoa(entry.password);
            const categoryLabel = this.getCategoryLabel(entry.category);
            const categoryClass = this.getCategoryClass(entry.category);
            
            passwordItem.innerHTML = `
                <div class="password-info">
                    <strong>
                        ${this.escapeHtml(entry.website)}
                        <span class="category-badge ${categoryClass}">${categoryLabel}</span>
                    </strong>
                    <div class="password-details">
                        <span class="username-field">
                            <i class="fas fa-user"></i>
                            <span class="username-text">${this.escapeHtml(entry.username)}</span>
                            <button class="copy-username-btn" data-username="${this.escapeHtml(entry.username)}">
                                <i class="fas fa-copy"></i>
                            </button>
                        </span>
                        <span class="password-field">
                            <i class="fas fa-lock"></i>
                            <span class="password-text">********</span>
                            <button class="toggle-password-btn" data-password="${safePassword}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </span>
                        <span><i class="fas fa-clock"></i> ${new Date(entry.lastModified).toLocaleDateString('en-US')}</span>
                    </div>
                </div>
                <div class="password-actions">
                    <button class="copy-btn" data-password="${safePassword}">
                        <i class="fas fa-copy"></i> Copy Password
                    </button>
                    <button class="delete-btn" data-id="${entry.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            const copyBtn = passwordItem.querySelector('.copy-btn');
            const copyUsernameBtn = passwordItem.querySelector('.copy-username-btn');
            const deleteBtn = passwordItem.querySelector('.delete-btn');
            const toggleBtn = passwordItem.querySelector('.toggle-password-btn');
            const passwordText = passwordItem.querySelector('.password-text');
            
            copyBtn.addEventListener('click', () => {
                try {
                    const password = atob(copyBtn.dataset.password);
                    this.copyToClipboard(password);
                } catch (error) {
                    console.error('Error decoding password:', error);
                    this.showNotification('Error copying password', 'error');
                }
            });

            copyUsernameBtn.addEventListener('click', () => {
                const username = copyUsernameBtn.dataset.username;
                this.copyToClipboard(username, 'username');
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(deleteBtn.dataset.id);
                if (!isNaN(id)) {
                    this.deletePassword(id);
                } else {
                    this.showNotification('Error deleting password', 'error');
                }
            });

            toggleBtn.addEventListener('click', () => {
                const icon = toggleBtn.querySelector('i');
                if (passwordText.textContent === '********') {
                    try {
                        const password = atob(toggleBtn.dataset.password);
                        passwordText.textContent = password;
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } catch (error) {
                        console.error('Error decoding password:', error);
                        this.showNotification('Error showing password', 'error');
                    }
                } else {
                    passwordText.textContent = '********';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
            
            this.passwordList.appendChild(passwordItem);
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadSettings() {
        return JSON.parse(localStorage.getItem('passwordManagerSettings')) || {
            defaultPasswordLength: 16,
            requireSpecialChars: true,
            requireNumbers: true,
            requireUppercase: true,
            requireLowercase: true,
            autoLockTimeout: 30,
            theme: 'light',
            language: 'en'
        };
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.passwordManager = new PasswordManager();
});

document.addEventListener('DOMContentLoaded', function() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileSection = document.querySelector('.profile-section');
    const profileEditForm = document.querySelector('.profile-edit-form');
    const editProfileForm = document.getElementById('editProfileForm');

    if (editProfileBtn && profileEditForm) {
        editProfileBtn.addEventListener('click', function() {
            const currentName = document.getElementById('profileName').textContent;
            const currentEmail = document.getElementById('profileEmail').textContent;
            
            document.getElementById('editName').value = currentName;
            document.getElementById('editEmail').value = currentEmail;
            
            profileSection.style.display = 'none';
            profileEditForm.style.display = 'block';
        });

        cancelEditBtn.addEventListener('click', function() {
            profileEditForm.style.display = 'none';
            profileSection.style.display = 'block';
        });

        editProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const newName = document.getElementById('editName').value;
            const newEmail = document.getElementById('editEmail').value;
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword && newPassword !== confirmPassword) {
                showNotification('The passwords do not match', 'error');
                return;
            }

            try {
                
                document.getElementById('profileName').textContent = newName;
                document.getElementById('profileEmail').textContent = newEmail;

                editProfileForm.reset();
                profileEditForm.style.display = 'none';
                profileSection.style.display = 'block';

                showNotification('Profile updated successfully', 'success');
            } catch (error) {
                showNotification('Error updating profile', 'error');
                console.error('Error updating profile:', error);
            }
        });
    }
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Profile section event listeners
document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.querySelector('.profile-edit-form').style.display = 'block';
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.querySelector('.profile-edit-form').style.display = 'none';
});

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (!auth.validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (newPassword) {
        if (newPassword !== confirmPassword) {
            showNotification('The new passwords do not match', 'error');
            return;
        }

        if (!auth.validatePassword(newPassword)) {
            showNotification('The new password must be at least 8 characters long', 'error');
            return;
        }

        if (!currentPassword) {
            showNotification('Please enter your current password', 'error');
            return;
        }

        const passwordChanged = auth.changePassword(currentPassword, newPassword);
        if (!passwordChanged) {
            showNotification('Current password is incorrect', 'error');
            return;
        }
    }

    const userData = {
        name,
        email,
        updatedAt: new Date().toISOString()
    };

    const success = auth.updateUserProfile(userData);
    if (success) {
        showNotification('Profile updated successfully', 'success');
        document.querySelector('.profile-edit-form').style.display = 'none';
        updateProfileDisplay();
    } else {
        showNotification('Error updating profile', 'error');
    }
});

document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        const success = auth.deleteAccount();
        if (success) {
            showNotification('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showNotification('Error deleting account', 'error');
        }
    }
});

function updateProfileDisplay() {
    const user = auth.currentUser;
    if (user) {
        document.querySelector('.profile-header h2').textContent = user.name;
        document.querySelector('.profile-header p').textContent = user.email;
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
    }
}