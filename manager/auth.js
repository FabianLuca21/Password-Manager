class Auth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }

    async init() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.isAuthenticated = true;
            this.redirectToDashboard();
        }

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });
    }

    switchTab(selectedTab) {
        const tabs = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        forms.forEach(form => form.classList.remove('active'));
        
        selectedTab.classList.add('active');
        const formId = selectedTab.dataset.tab + 'Form';
        document.getElementById(formId).classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!this.validateEmail(email)) {
            this.showNotification('Bitte geben Sie eine gültige E-Mail-Adresse ein', 'error');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showNotification('Das Passwort muss mindestens 8 Zeichen lang sein', 'error');
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showNotification('Erfolgreich angemeldet!', 'success');
                this.redirectToDashboard();
            } else {
                this.showNotification('Ungültige Anmeldedaten', 'error');
            }
        } catch (error) {
            this.showNotification('Ein Fehler ist aufgetreten', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!this.validateName(name)) {
            this.showNotification('Bitte geben Sie einen gültigen Namen ein', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showNotification('Bitte geben Sie eine gültige E-Mail-Adresse ein', 'error');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showNotification('Das Passwort muss mindestens 8 Zeichen lang sein', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwörter stimmen nicht überein', 'error');
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            if (users.some(u => u.email === email)) {
                this.showNotification('Diese E-Mail-Adresse ist bereits registriert', 'error');
                return;
            }

            const newUser = {
                id: Date.now(),
                name,
                email,
                password,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            this.showNotification('Registrierung erfolgreich! Bitte melden Sie sich an.', 'success');
            this.switchTab(document.querySelector('[data-tab="login"]'));
        } catch (error) {
            this.showNotification('Ein Fehler ist aufgetreten', 'error');
        }
    }

    validateName(name) {
        return name && name.length >= 2 && /^[a-zA-ZäöüÄÖÜß\s-]+$/.test(name);
    }

    validateEmail(email) {
        return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 8;
    }

    togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const inputId = button.dataset.target;
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    redirectToDashboard() {
        window.location.href = 'index.html';
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    updateUserProfile(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);

            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...userData };
                localStorage.setItem('users', JSON.stringify(users));
                this.currentUser = users[userIndex];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Profils:', error);
            return false;
        }
    }

    changePassword(currentPassword, newPassword) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);

            if (userIndex !== -1 && users[userIndex].password === currentPassword) {
                users[userIndex].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));
                this.currentUser = users[userIndex];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Fehler beim Ändern des Passworts:', error);
            return false;
        }
    }

    deleteAccount() {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');

            const updatedUsers = users.filter(u => u.id !== this.currentUser.id);
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            const updatedPasswords = passwords.filter(p => p.userId !== this.currentUser.id);
            localStorage.setItem('passwords', JSON.stringify(updatedPasswords));

            this.logout();
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Kontos:', error);
            return false;
        }
    }
}

const auth = new Auth(); 