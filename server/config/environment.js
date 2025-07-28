/**
 * Environment Configuration
 * Centralized configuration management
 */

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 8001,
        host: process.env.HOST || 'localhost'
    },
    
    // Application settings
    app: {
        updateInterval: 30000, // 30 seconds
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        passwordMinLength: 4
    },
    
    // External services
    external: {
        timeout: 5000,
        baseUrl: 'https://coolify.{subdomain}.techify.free/login'
    },
    
    // File paths
    files: {
        config: 'config.json'
    }
};

module.exports = config;
