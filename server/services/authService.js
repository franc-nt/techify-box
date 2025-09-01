/**
 * Authentication Service
 * Handles user authentication and session management
 */

const crypto = require('crypto');
const config = require('../config/environment');
const ConfigService = require('./configService');

class AuthService {
    constructor() {
        // Armazenar sessões em memória (mantido como solicitado)
        this.sessions = new Map();
    }

    /**
     * Generate password hash using SHA-256
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        if (!password || password.length < config.app.passwordMinLength) {
            return {
                valid: false,
                error: `Senha deve ter pelo menos ${config.app.passwordMinLength} caracteres`
            };
        }
        return { valid: true };
    }

    /**
     * Check if user is authenticated
     * @param {string} sessionId - Session ID to check
     * @returns {boolean} Authentication status
     */
    isAuthenticated(sessionId) {
        if (!sessionId) return false;
        
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        // Check session timeout (opcional, mas boa prática)
        const now = Date.now();
        if (now - session.createdAt > config.app.sessionTimeout) {
            this.sessions.delete(sessionId);
            return false;
        }
        
        return true;
    }

    /**
     * Login user with password
     * @param {string} password - User password
     * @returns {Object} Login result
     */
    login(password) {
        const passwordHash = ConfigService.getPasswordHash();
        
        if (!passwordHash) {
            return {
                success: false,
                error: 'Nenhuma senha configurada'
            };
        }
        
        const hashedInput = this.hashPassword(password);
        
        if (hashedInput !== passwordHash) {
            return {
                success: false,
                error: 'Senha incorreta'
            };
        }
        
        const sessionId = this.generateSessionId();
        this.sessions.set(sessionId, { 
            createdAt: Date.now(),
            lastActivity: Date.now()
        });
        
        return {
            success: true,
            sessionId: sessionId
        };
    }

    /**
     * Set new password
     * @param {string} password - New password
     * @returns {Object} Operation result
     */
    setPassword(password) {
        const validation = this.validatePassword(password);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }
        
        const hashedPassword = this.hashPassword(password);
        const success = ConfigService.updatePassword(hashedPassword);
        
        if (success) {
            // Limpar todas as sessões existentes
            this.sessions.clear();
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Erro ao salvar configuração'
            };
        }
    }

    /**
     * Remove password protection
     * @returns {Object} Operation result
     */
    removePassword() {
        const success = ConfigService.removePassword();
        
        if (success) {
            // Limpar todas as sessões
            this.sessions.clear();
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Erro ao salvar configuração'
            };
        }
    }

    /**
     * Logout user
     * @param {string} sessionId - Session ID to terminate
     * @returns {Object} Operation result
     */
    logout(sessionId) {
        if (sessionId) {
            this.sessions.delete(sessionId);
        }
        return { success: true };
    }

    /**
     * Get authentication status
     * @param {string} sessionId - Session ID to check
     * @returns {Object} Authentication status
     */
    getAuthStatus(sessionId) {
        const hasPassword = ConfigService.hasPassword();
        const isAuthenticated = hasPassword ? this.isAuthenticated(sessionId) : true;
        
        return {
            hasPassword,
            isAuthenticated
        };
    }

    /**
     * Clean expired sessions (maintenance method)
     */
    cleanExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt > config.app.sessionTimeout) {
                this.sessions.delete(sessionId);
            }
        }
    }
}

// Export singleton instance
module.exports = new AuthService();
