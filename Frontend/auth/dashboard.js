// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://127.0.0.1:8000';
const TOKEN_STORAGE_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

// ==================== DOM ELEMENTS ====================
const loadingScreen = document.getElementById('loadingScreen');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const usernameDisplay = document.getElementById('username');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const apiButtons = document.querySelectorAll('.api-btn');
const apiResponseContainer = document.getElementById('apiResponseContainer');

// Stats elements
const departmentsCount = document.getElementById('departmentsCount');
const employeesCount = document.getElementById('employeesCount');
const documentsCount = document.getElementById('documentsCount');
const shiftsCount = document.getElementById('shiftsCount');

// ==================== UTILITY FUNCTIONS ====================
function getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function showLoading() {
    loadingScreen.style.display = 'flex';
    dashboard.style.display = 'none';
}

function hideLoading() {
    loadingScreen.style.display = 'none';
    dashboard.style.display = 'block';
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

// ==================== API FUNCTIONS ====================
async function makeAuthenticatedRequest(url, options = {}) {
    const token = getStoredToken();
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            // Token expired or invalid
            clearTokens();
            redirectToLogin();
            throw new Error('Authentication failed');
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

async function verifyAdminAccess() {
    try {
        // Verify admin access using our custom endpoint
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/admin/profile/`);
        
        // Update username display
        if (response.username) {
            usernameDisplay.textContent = response.username;
        }
        
        return true;
    } catch (error) {
        console.error('Admin verification failed:', error);
        clearTokens();
        redirectToLogin();
        return false;
    }
}

async function fetchStats() {
    try {
        const endpoints = [
            { key: 'departments', url: `${API_BASE_URL}/departments/list/` },
            { key: 'employees', url: `${API_BASE_URL}/employees/list/` },
            { key: 'documents', url: `${API_BASE_URL}/documents/list/` },
            { key: 'shifts', url: `${API_BASE_URL}/shifts/list/` }
        ];
        
        const results = await Promise.allSettled(
            endpoints.map(endpoint => 
                makeAuthenticatedRequest(endpoint.url)
                    .then(data => ({ [endpoint.key]: Array.isArray(data) ? data.length : 0 }))
                    .catch(() => ({ [endpoint.key]: 0 }))
            )
        );
        
        const stats = results.reduce((acc, result) => {
            if (result.status === 'fulfilled') {
                Object.assign(acc, result.value);
            }
            return acc;
        }, {});
        
        // Update UI
        departmentsCount.textContent = stats.departments || 0;
        employeesCount.textContent = stats.employees || 0;
        documentsCount.textContent = stats.documents || 0;
        shiftsCount.textContent = stats.shifts || 0;
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default values
        departmentsCount.textContent = '0';
        employeesCount.textContent = '0';
        documentsCount.textContent = '0';
        shiftsCount.textContent = '0';
    }
}

// ==================== API ENDPOINT TESTING ====================
async function testApiEndpoint(endpoint, action) {
    const button = document.querySelector(`[data-endpoint="${endpoint}"][data-action="${action}"]`);
    
    if (!button) return;
    
    button.classList.add('loading');
    button.disabled = true;
    
    try {
        let url, method, body;
        
        switch (action) {
            case 'list':
                url = `${API_BASE_URL}/${endpoint}/list/`;
                method = 'GET';
                break;
                
            case 'create':
                url = `${API_BASE_URL}/${endpoint}/create/`;
                method = 'POST';
                body = getTestData(endpoint);
                break;
                
            case 'update':
                url = `${API_BASE_URL}/${endpoint}/update/1/`;
                method = 'PUT';
                body = getTestData(endpoint);
                break;
                
            case 'delete':
                url = `${API_BASE_URL}/${endpoint}/delete/1/`;
                method = 'DELETE';
                break;
                
            default:
                throw new Error('Unknown action');
        }
        
        const options = {
            method,
            ...(body && { body: JSON.stringify(body) })
        };
        
        const result = await makeAuthenticatedRequest(url, options);
        
        displayApiResponse('success', {
            endpoint,
            action,
            url,
            method,
            response: result
        });
        
    } catch (error) {
        displayApiResponse('error', {
            endpoint,
            action,
            error: error.message
        });
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function getTestData(endpoint) {
    const testData = {
        departments: {
            name: 'Test Department',
            description: 'A test department created via API'
        },
        employees: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@test.com',
            department: 1
        },
        documents: {
            title: 'Test Document',
            description: 'A test document uploaded via API',
            employee: 1
        },
        shifts: {
            employee: 1,
            start_time: '09:00:00',
            end_time: '17:00:00',
            date: new Date().toISOString().split('T')[0]
        },
        'swap-requests': {
            requesting_employee: 1,
            target_employee: 2,
            requested_shift: 1,
            offered_shift: 2,
            reason: 'Personal reasons'
        },
        leaves: {
            employee: 1,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reason: 'Vacation'
        }
    };
    
    return testData[endpoint] || {};
}

function displayApiResponse(type, data) {
    apiResponseContainer.innerHTML = '';
    
    const responseDiv = document.createElement('div');
    
    if (type === 'success') {
        responseDiv.className = 'response-success';
        responseDiv.innerHTML = `
            <strong>✅ ${data.action.toUpperCase()} - ${data.endpoint}</strong><br>
            <small>${data.method} ${data.url}</small>
            <div class="response-json">${JSON.stringify(data.response, null, 2)}</div>
        `;
    } else {
        responseDiv.className = 'response-error';
        responseDiv.innerHTML = `
            <strong>❌ ${data.action.toUpperCase()} - ${data.endpoint}</strong><br>
            <small>Error: ${data.error}</small>
        `;
    }
    
    apiResponseContainer.appendChild(responseDiv);
}

// ==================== NAVIGATION ====================
function switchSection(sectionId) {
    // Update nav items
    navItems.forEach(item => {
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update content sections
    contentSections.forEach(section => {
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Load section-specific data
    loadSectionData(sectionId);
}

async function loadSectionData(sectionId) {
    const dataContainer = document.getElementById(`${sectionId}Data`);
    if (!dataContainer) return;
    
    dataContainer.innerHTML = '<p>Loading...</p>';
    
    try {
        const data = await makeAuthenticatedRequest(`${API_BASE_URL}/${sectionId}/list/`);
        
        if (Array.isArray(data) && data.length > 0) {
            dataContainer.innerHTML = `
                <div class="response-json">${JSON.stringify(data, null, 2)}</div>
            `;
        } else {
            dataContainer.innerHTML = '<p>No data available</p>';
        }
    } catch (error) {
        dataContainer.innerHTML = `<div class="response-error">Error loading data: ${error.message}</div>`;
    }
}

// ==================== EVENT HANDLERS ====================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Try to logout via API first
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (refreshToken) {
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

function handleNavigation(event) {
    const navItem = event.target.closest('.nav-item');
    if (navItem && navItem.dataset.section) {
        switchSection(navItem.dataset.section);
    }
}

function handleApiTest(event) {
    const button = event.target.closest('.api-btn');
    if (button && !button.disabled) {
        const endpoint = button.dataset.endpoint;
        const action = button.dataset.action;
        testApiEndpoint(endpoint, action);
    }
}

// ==================== INITIALIZATION ====================
async function initializeDashboard() {
    try {
        showLoading();
        
        // Verify admin access
        const hasAccess = await verifyAdminAccess();
        if (!hasAccess) return;
        
        // Load initial data
        await fetchStats();
        
        // Show dashboard
        hideLoading();
        
        // Load overview data
        switchSection('overview');
        
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        clearTokens();
        redirectToLogin();
    }
}

function initializeEventListeners() {
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // API testing buttons
    apiButtons.forEach(button => {
        button.addEventListener('click', handleApiTest);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Handle escape key
        }
    });
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Check for authentication token
    const token = getStoredToken();
    if (!token) {
        redirectToLogin();
        return;
    }
    
    initializeEventListeners();
    initializeDashboard();
});

// ==================== PERIODIC TOKEN REFRESH ====================
// Refresh token every 15 minutes
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
                console.log('Token refreshed successfully');
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
