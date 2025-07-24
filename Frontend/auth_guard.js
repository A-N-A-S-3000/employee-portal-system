// ==================== AUTHENTICATION GUARD ====================
const API_BASE_URL = 'http://127.0.0.1:8000';
const TOKEN_STORAGE_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

// ==================== UTILITY FUNCTIONS ====================
function getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('admin_user_info');
    sessionStorage.removeItem('admin_user_info');
}

function redirectToLogin() {
    window.location.href = 'auth/login.html';
}

// ==================== API FUNCTIONS ====================
async function verifyAuthentication() {
    const token = getStoredToken();
    
    if (!token) {
        redirectToLogin();
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/profile/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 401) {
            // Token expired, try to refresh
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
            
            if (refreshToken) {
                const refreshResponse = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        refresh: refreshToken
                    })
                });

                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    const storage = localStorage.getItem(TOKEN_STORAGE_KEY) ? localStorage : sessionStorage;
                    storage.setItem(TOKEN_STORAGE_KEY, refreshData.access);
                    return true;
                } else {
                    throw new Error('Token refresh failed');
                }
            } else {
                throw new Error('No refresh token available');
            }
        }

        if (response.status === 403) {
            clearTokens();
            alert('Access denied. Admin privileges required.');
            redirectToLogin();
            return false;
        }

        if (!response.ok) {
            throw new Error('Authentication verification failed');
        }

        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        clearTokens();
        redirectToLogin();
        return false;
    }
}

// ==================== UI ENHANCEMENTS ====================
function addLogoutButton() {
    const header = document.querySelector('.header');
    if (header) {
        // Create logout button container
        const logoutContainer = document.createElement('div');
        logoutContainer.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        `;

        // Add user info
        const userInfo = getUserInfo();
        if (userInfo) {
            const userDisplay = document.createElement('span');
            userDisplay.style.cssText = `
                color: #666;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            userDisplay.innerHTML = `
                <i class="fas fa-user-circle" style="color: #007bff;"></i>
                Welcome, ${userInfo.username}
            `;
            logoutContainer.appendChild(userDisplay);
        }

        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.style.cssText = `
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.3s ease;
        `;

        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.background = '#c82333';
        });

        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.background = '#dc3545';
        });

        logoutBtn.addEventListener('click', handleLogout);

        logoutContainer.appendChild(logoutBtn);
        
        // Make header position relative for absolute positioning
        header.style.position = 'relative';
        header.appendChild(logoutContainer);
    }
}

function getUserInfo() {
    const userInfoStr = localStorage.getItem('admin_user_info') || sessionStorage.getItem('admin_user_info');
    if (userInfoStr) {
        try {
            return JSON.parse(userInfoStr);
        } catch (error) {
            console.error('Error parsing user info:', error);
            return null;
        }
    }
    return null;
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (refreshToken) {
            // Try to logout via API
            fetch(`${API_BASE_URL}/api/admin/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getStoredToken()}`
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            }).catch(error => {
                console.error('Logout API call failed:', error);
            }).finally(() => {
                clearTokens();
                redirectToLogin();
            });
        } else {
            clearTokens();
            redirectToLogin();
        }
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    const content = document.querySelector('.content');
    if (content) {
        content.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: #666;">Verifying authentication...</p>
            </div>
        `;
    }

    // Add CSS for loading animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Verify authentication
    const isAuthenticated = await verifyAuthentication();
    
    if (isAuthenticated) {
        // Restore original content
        if (content) {
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Welcome to the Employee Management System</h2>
                    </div>
                    <div class="card-body">
                        <p>Select a section from the sidebar to get started.</p>
                        <div class="d-flex gap-2 mt-2">
                            <a href="employees/employees.html" class="btn btn-primary">
                                <i class="fas fa-users"></i> Manage Employees
                            </a>
                            <a href="departments/departments.html" class="btn btn-secondary">
                                <i class="fas fa-building"></i> Manage Departments
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add logout button
        addLogoutButton();
        
        console.log('User authenticated successfully');
    }
    // If not authenticated, user will be redirected to login
});

// ==================== PERIODIC TOKEN REFRESH ====================
setInterval(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (refreshToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const storage = localStorage.getItem(TOKEN_STORAGE_KEY) ? localStorage : sessionStorage;
                storage.setItem(TOKEN_STORAGE_KEY, data.access);
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            clearTokens();
            redirectToLogin();
        }
    }
}, 15 * 60 * 1000); // 15 minutes

// ==================== GLOBAL LOGOUT FUNCTION ====================
// Make logout function available globally for sidebar logout button
window.logout = handleLogout;
