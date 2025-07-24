// ==================== SHARED AUTHENTICATION UTILITY ====================
// This file should be included in all frontend pages that make API calls

const API_BASE_URL = 'http://127.0.0.1:8000';
const TOKEN_STORAGE_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

// ==================== AUTHENTICATION UTILITIES ====================
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
    window.location.href = '../auth/login.html';
}

// ==================== AUTHENTICATED FETCH WRAPPER ====================
async function authenticatedFetch(url, options = {}) {
    const token = getStoredToken();
    
    if (!token) {
        console.error('No authentication token found');
        redirectToLogin();
        throw new Error('Authentication required');
    }
    
    // Prepare headers with authentication
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            // Token expired, try to refresh
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
            
            if (refreshToken) {
                try {
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
                        
                        // Retry original request with new token
                        config.headers.Authorization = `Bearer ${refreshData.access}`;
                        return await fetch(url, config);
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                }
            }
            
            // If refresh failed, redirect to login
            clearTokens();
            alert('Your session has expired. Please log in again.');
            redirectToLogin();
            throw new Error('Authentication failed');
        }
        
        if (response.status === 403) {
            alert('Access denied. Admin privileges required.');
            clearTokens();
            redirectToLogin();
            throw new Error('Access denied');
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// ==================== CONVENIENCE METHODS ====================
const authAPI = {
    get: (url) => authenticatedFetch(url, { method: 'GET' }),
    post: (url, data) => authenticatedFetch(url, { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    put: (url, data) => authenticatedFetch(url, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    }),
    delete: (url) => authenticatedFetch(url, { method: 'DELETE' })
};

// ==================== AUTHENTICATION CHECK ====================
function checkAuthentication() {
    const token = getStoredToken();
    if (!token) {
        redirectToLogin();
        return false;
    }
    return true;
}

// ==================== PAGE PROTECTION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    if (!checkAuthentication()) {
        return; // Will redirect to login
    }
    
    // Logout functionality is now handled by sidebar logout buttons
    // No need to add dynamic logout buttons
});

// ==================== LOGOUT FUNCTION ====================
function logout() {
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

// ==================== LEGACY COMPATIBILITY ====================
// For backward compatibility with existing code
window.authenticatedFetch = authenticatedFetch;
window.authAPI = authAPI;
window.checkAuthentication = checkAuthentication;
window.logout = logout;
