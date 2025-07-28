/**
 * Authentication Middleware
 * Middleware para verificar autenticação nas rotas protegidas
 */

const AuthService = require('../services/authService');
const ConfigService = require('../services/configService');

/**
 * Extract session ID from request header
 * @param {Object} req - Express request object
 * @returns {string|null} Session ID or null
 */
function extractSessionId(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
}

/**
 * Middleware para requerir autenticação
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requireAuth(req, res, next) {
    // Se não há senha configurada, permitir acesso
    if (!ConfigService.hasPassword()) {
        return next();
    }
    
    const sessionId = extractSessionId(req);
    
    if (!sessionId || !AuthService.isAuthenticated(sessionId)) {
        return res.status(401).json({ 
            error: 'Não autorizado',
            code: 'UNAUTHORIZED' 
        });
    }
    
    // Adicionar session ID ao request para uso posterior
    req.sessionId = sessionId;
    next();
}

/**
 * Middleware opcional de autenticação (não bloqueia se não autenticado)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function optionalAuth(req, res, next) {
    const sessionId = extractSessionId(req);
    
    if (sessionId && AuthService.isAuthenticated(sessionId)) {
        req.sessionId = sessionId;
    }
    
    next();
}

module.exports = {
    requireAuth,
    optionalAuth,
    extractSessionId
};
