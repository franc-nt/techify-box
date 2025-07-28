/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

const DOMUtils = {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {Element|null} DOM element or null
     */
    getElementById(id) {
        return document.getElementById(id);
    },

    /**
     * Get element by selector
     * @param {string} selector - CSS selector
     * @returns {Element|null} DOM element or null
     */
    querySelector(selector) {
        return document.querySelector(selector);
    },

    /**
     * Get elements by selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} Node list
     */
    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Add event listener to element
     * @param {Element} element - DOM element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    addEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    },

    /**
     * Remove event listener from element
     * @param {Element} element - DOM element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    removeEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.removeEventListener(event, handler);
        }
    },

    /**
     * Set element content safely
     * @param {Element} element - DOM element
     * @param {string} content - Content to set
     * @param {boolean} isHTML - Whether content is HTML (default: false)
     */
    setContent(element, content, isHTML = false) {
        if (!element) return;
        
        if (isHTML) {
            element.innerHTML = this.sanitizeHTML(content);
        } else {
            element.textContent = content;
        }
    },

    /**
     * Basic HTML sanitization (remove script tags)
     * @param {string} html - HTML string
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        if (typeof html !== 'string') return '';
        
        // Remove script tags and their content
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },

    /**
     * Add CSS class to element
     * @param {Element} element - DOM element
     * @param {string} className - CSS class name
     */
    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    },

    /**
     * Remove CSS class from element
     * @param {Element} element - DOM element
     * @param {string} className - CSS class name
     */
    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    },

    /**
     * Toggle CSS class on element
     * @param {Element} element - DOM element
     * @param {string} className - CSS class name
     * @returns {boolean} Whether class is now present
     */
    toggleClass(element, className) {
        if (element && className) {
            return element.classList.toggle(className);
        }
        return false;
    },

    /**
     * Check if element has CSS class
     * @param {Element} element - DOM element
     * @param {string} className - CSS class name
     * @returns {boolean} Whether element has the class
     */
    hasClass(element, className) {
        if (element && className) {
            return element.classList.contains(className);
        }
        return false;
    },

    /**
     * Show element
     * @param {Element} element - DOM element
     */
    show(element) {
        if (element) {
            element.style.display = '';
        }
    },

    /**
     * Hide element
     * @param {Element} element - DOM element
     */
    hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    },

    /**
     * Get element value (for form inputs)
     * @param {Element} element - DOM element
     * @returns {string} Element value
     */
    getValue(element) {
        if (element && 'value' in element) {
            return element.value;
        }
        return '';
    },

    /**
     * Set element value (for form inputs)
     * @param {Element} element - DOM element
     * @param {string} value - Value to set
     */
    setValue(element, value) {
        if (element && 'value' in element) {
            element.value = value;
        }
    },

    /**
     * Clear element value (for form inputs)
     * @param {Element} element - DOM element
     */
    clearValue(element) {
        this.setValue(element, '');
    }
};

// Export to global scope
window.DOMUtils = DOMUtils;
