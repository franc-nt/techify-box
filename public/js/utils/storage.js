/**
 * Storage Utilities
 * Wrapper for localStorage with error handling
 */

const StorageUtils = {
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Error setting localStorage item:', error);
            return false;
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored value or default value
     */
    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error('Error getting localStorage item:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage item:', error);
            return false;
        }
    },

    /**
     * Clear all localStorage items
     * @returns {boolean} Success status
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    /**
     * Check if localStorage is available
     * @returns {boolean} Availability status
     */
    isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get session ID from storage
     * @returns {string|null} Session ID or null
     */
    getSessionId() {
        return this.getItem(window.CONFIG.APP.SESSION_STORAGE_KEY);
    },

    /**
     * Set session ID in storage
     * @param {string} sessionId - Session ID to store
     * @returns {boolean} Success status
     */
    setSessionId(sessionId) {
        return this.setItem(window.CONFIG.APP.SESSION_STORAGE_KEY, sessionId);
    },

    /**
     * Remove session ID from storage
     * @returns {boolean} Success status
     */
    removeSessionId() {
        return this.removeItem(window.CONFIG.APP.SESSION_STORAGE_KEY);
    }
};

// Export to global scope
window.StorageUtils = StorageUtils;
