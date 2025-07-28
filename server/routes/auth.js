/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { requireAuth, extractSessionId } = require('../middleware/auth');

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', (req, res) => {
    try {
        const sessionId = extractSessionId(req);
        const authStatus = AuthService.getAuthStatus(sessionId);
        
        res.json(authStatus);
    } catch (error) {
        console.error('Auth status error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR' 
        });
    }
});

/**
 * POST /api/auth/login
 * Login with password
 */
router.post('/login', (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ 
                error: 'Senha é obrigatória',
                code: 'MISSING_PASSWORD' 
            });
        }
        
        const result = AuthService.login(password);
        
        if (result.success) {
            res.json({ sessionId: result.sessionId });
        } else {
            res.status(401).json({ 
                error: result.error,
                code: 'LOGIN_FAILED' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR' 
        });
    }
});

/**
 * POST /api/auth/set-password
 * Set new password
 */
router.post('/set-password', (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ 
                error: 'Senha é obrigatória',
                code: 'MISSING_PASSWORD' 
            });
        }
        
        const result = AuthService.setPassword(password);
        
        if (result.success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ 
                error: result.error,
                code: 'SET_PASSWORD_FAILED' 
            });
        }
    } catch (error) {
        console.error('Set password error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR' 
        });
    }
});

/**
 * POST /api/auth/remove-password
 * Remove password protection (requires authentication)
 */
router.post('/remove-password', requireAuth, (req, res) => {
    try {
        const result = AuthService.removePassword();
        
        if (result.success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ 
                error: result.error,
                code: 'REMOVE_PASSWORD_FAILED' 
            });
        }
    } catch (error) {
        console.error('Remove password error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR' 
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
    try {
        const sessionId = extractSessionId(req);
        const result = AuthService.logout(sessionId);
        
        res.json({ success: result.success });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR' 
        });
    }
});

module.exports = router;
