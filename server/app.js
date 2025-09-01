/**
 * Techify Free Tools - Main Application
 * Modular Express.js application with authentication
 */

const express = require('express');
const config = require('./config/environment');

// Import routes
const authRoutes = require('./routes/auth');
const statusRoutes = require('./routes/status');
const updateRoutes = require('./routes/updates');

// Create Express application
const app = express();

/**
 * Configure Express middleware
 */
function configureMiddleware(app) {
    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Serve static files from public directory
    app.use(express.static('public'));
    
    // Request logging (simple)
    app.use((req, res, next) => {
        console.log(`[AUTO-RELOAD] ${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

/**
 * Configure application routes
 */
function configureRoutes(app) {
    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/status', statusRoutes);
    app.use('/api/updates', updateRoutes);
    
    // Health check endpoint (no auth required)
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toLocaleString('pt-BR') + ' - PM2 WATCH TESTADO',
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0'
        });
    });
    
    // Catch-all for undefined routes
    app.use('/api/*', (req, res) => {
        res.status(404).json({
            error: 'Endpoint não encontrado',
            code: 'NOT_FOUND',
            path: req.path
        });
    });
}

/**
 * Configure error handling
 */
function configureErrorHandling(app) {
    // Global error handler
    app.use((error, req, res, next) => {
        console.error('Unhandled error:', error);
        
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    });
}

/**
 * Initialize application
 */
function initializeApp() {
    configureMiddleware(app);
    configureRoutes(app);
    configureErrorHandling(app);
    
    return app;
}

module.exports = initializeApp();
