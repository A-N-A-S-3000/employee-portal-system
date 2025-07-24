// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://127.0.0.1:8000';
const TOKEN_STORAGE_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

// ==================== DOM ELEMENTS ====================
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const rememberMeCheckbox = document.getElementById('rememberMe');

// ==================== UTILITY FUNCTIONS ====================
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

function storeTokens(accessToken, refreshToken) {
    const storage = rememberMeCheckbox.checked ? localStorage : sessionStorage;
    storage.setItem(TOKEN_STORAGE_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ==================== API FUNCTIONS ====================
async function authenticateUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.detail || 'Authentication failed');
        }

        return data;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

async function verifyAdminStatus(accessToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/profile/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 403) {
            throw new Error('Access denied. Admin privileges required.');
        }

        if (!response.ok) {
            throw new Error('Unable to verify admin status');
        }

        const userData = await response.json();
        if (!userData.is_staff && !userData.is_superuser) {
            throw new Error('Access denied. Admin privileges required.');
        }

        return true;
    } catch (error) {
        console.error('Admin verification error:', error);
        throw error;
    }
}

// ==================== EVENT HANDLERS ====================
function handleTogglePassword() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    const icon = togglePasswordBtn.querySelector('i');
    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Validation
    if (!username || !password) {
        showError('Please fill in all fields');
        return;
    }

    setLoading(true);
    hideError();

    try {
        // Step 1: Authenticate user (admin check is built into this endpoint)
        const authData = await authenticateUser(username, password);
        
        // Step 2: Store tokens
        storeTokens(authData.access, authData.refresh);
        
        // Step 3: Store user info
        if (authData.user) {
            const storage = rememberMeCheckbox.checked ? localStorage : sessionStorage;
            storage.setItem('admin_user_info', JSON.stringify(authData.user));
        }
        
        // Step 4: Show success and redirect
        showSuccessAndRedirect();
        
    } catch (error) {
        let errorMsg = 'Login failed. Please try again.';
        
        if (error.message.includes('Admin privileges required') || 
            error.message.includes('Access denied')) {
            errorMsg = 'Access denied. Only admin users can log in.';
        } else if (error.message.includes('Invalid username or password')) {
            errorMsg = 'Invalid username or password.';
        } else if (error.message.includes('User account is disabled')) {
            errorMsg = 'Your account has been disabled.';
        }
        
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
}

function showSuccessAndRedirect() {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        Login successful! Redirecting...
    `;
    
    document.body.appendChild(successDiv);
    
    // Redirect after a short delay
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1500);
}

// ==================== INITIALIZATION ====================
function checkExistingAuth() {
    const token = getStoredToken();
    if (token) {
        // Verify token is still valid
        verifyAdminStatus(token)
            .then(() => {
                window.location.href = '../index.html';
            })
            .catch(() => {
                clearTokens();
            });
    }
}

function initializeEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    togglePasswordBtn.addEventListener('click', handleTogglePassword);
    
    // Enter key handling
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
    
    // Hide error when typing
    usernameInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkExistingAuth();
    initializeEventListeners();
    
    // Focus username field
    usernameInput.focus();
});

// ==================== KEYBOARD ACCESSIBILITY ====================
document.addEventListener('keydown', (e) => {
    // Escape key clears error
    if (e.key === 'Escape') {
        hideError();
    }
});

// ==================== CSS ANIMATION FOR SUCCESS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
