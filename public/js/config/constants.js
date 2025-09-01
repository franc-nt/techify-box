/**
 * Frontend Configuration Constants
 * Centralized configuration for the frontend application
 */

const CONFIG = {
    // API endpoints
    API: {
        BASE_URL: '',
        STATUS: '/api/status',
        AUTH: {
            BASE: '/api/auth',
            STATUS: '/api/auth/status',
            LOGIN: '/api/auth/login',
            SET_PASSWORD: '/api/auth/set-password',
            REMOVE_PASSWORD: '/api/auth/remove-password',
            LOGOUT: '/api/auth/logout'
        }
    },
    
    // Application settings
    APP: {
        UPDATE_INTERVAL: 30000, // 30 seconds
        PASSWORD_MIN_LENGTH: 4,
        SESSION_STORAGE_KEY: 'sessionId'
    },
    
    // UI settings
    UI: {
        LOADING_TRANSITION_DURATION: 300, // milliseconds
        ERROR_DISPLAY_DURATION: 5000, // 5 seconds
        SUCCESS_DISPLAY_DURATION: 3000 // 3 seconds
    },
    
    // DOM selectors
    SELECTORS: {
        CONTAINER: '.container',
        SUBDOMAIN: '#subdomain',
        URL_CONTAINER: '#url-container',
        STATUS_CONTAINER: '#status-container',
        TIMESTAMP: '#timestamp',
        LOGIN_PASSWORD: '#login-password',
        NEW_PASSWORD: '#new-password',
        LOGIN_ERROR: '#login-error'
    },
    
    // CSS classes
    CSS_CLASSES: {
        LOADING: 'loading',
        BADGE_OK: 'badge-ok',
        BADGE_FAIL: 'badge-fail',
        BTN_PRIMARY: 'btn btn-primary',
        BTN_SECONDARY: 'btn btn-secondary',
        BTN_DANGER: 'btn btn-danger',
        BTN_SMALL: 'btn btn-small'
    }
};

// Make CONFIG immutable
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.API.AUTH);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.SELECTORS);
Object.freeze(CONFIG.CSS_CLASSES);

// Export for use in other modules
window.CONFIG = CONFIG;
