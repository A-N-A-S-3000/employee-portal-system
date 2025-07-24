// ==================== ENVIRONMENT CONFIGURATION ====================
// This file should be updated for different environments

const CONFIG = {
    // Development
    development: {
        API_BASE_URL: 'http://127.0.0.1:8000',
        DEBUG: true,
        LOG_LEVEL: 'debug'
    },
    
    // Production
    production: {
        API_BASE_URL: 'https://your-domain.com',  // CHANGE THIS
        DEBUG: false,
        LOG_LEVEL: 'error'
    },
    
    // Staging
    staging: {
        API_BASE_URL: 'https://staging.your-domain.com',  // CHANGE THIS
        DEBUG: true,
        LOG_LEVEL: 'warn'
    }
};

// Auto-detect environment (you can customize this logic)
function getEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('staging')) {
        return 'staging';
    } else {
        return 'production';
    }
}

// Export current environment config
const CURRENT_ENV = getEnvironment();
const ENV_CONFIG = CONFIG[CURRENT_ENV];

// Global configuration object
window.APP_CONFIG = {
    API_BASE_URL: ENV_CONFIG.API_BASE_URL,
    DEBUG: ENV_CONFIG.DEBUG,
    LOG_LEVEL: ENV_CONFIG.LOG_LEVEL,
    ENVIRONMENT: CURRENT_ENV
};

console.log(`🚀 App running in ${CURRENT_ENV} mode`);
console.log(`📡 API Base URL: ${ENV_CONFIG.API_BASE_URL}`);
