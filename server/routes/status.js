/**
 * Status Routes
 * Handles status and health check endpoints
 */

const express = require('express');
const router = express.Router();
const ConfigService = require('../services/configService');
const HealthService = require('../services/healthService');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/status
 * Get current application status (protected route)
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const subdomain = ConfigService.getSubdomain();
        const statusData = await HealthService.getCurrentStatus(subdomain);
        
        res.json(statusData);
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ 
            error: 'Erro ao obter status',
            code: 'STATUS_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * GET /api/status/health
 * Simple health check endpoint (unprotected)
 */
router.get('/health', (req, res) => {
    try {
        res.json({
            status: 'ok',
            timestamp: new Date().toLocaleString('pt-BR'),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ 
            error: 'Erro no health check',
            code: 'HEALTH_ERROR' 
        });
    }
});

/**
 * GET /api/status/subdomain
 * Get current subdomain (protected route)
 */
router.get('/subdomain', requireAuth, (req, res) => {
    try {
        const subdomain = ConfigService.getSubdomain();
        
        res.json({
            subdomain: subdomain,
            timestamp: new Date().toLocaleString('pt-BR')
        });
    } catch (error) {
        console.error('Subdomain error:', error);
        res.status(500).json({ 
            error: 'Erro ao obter subdomínio',
            code: 'SUBDOMAIN_ERROR' 
        });
    }
});

/**
 * GET /api/status/applications
 * Get applications with resolved URLs (protected route)
 */
router.get('/applications', requireAuth, (req, res) => {
    try {
        const applications = ConfigService.getApplications();
        
        res.json({
            applications: applications,
            timestamp: new Date().toLocaleString('pt-BR')
        });
    } catch (error) {
        console.error('Applications error:', error);
        res.status(500).json({ 
            error: 'Erro ao obter aplicações',
            code: 'APPLICATIONS_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * PUT /api/status/applications/:index
 * Update specific application by index (protected route)
 */
router.put('/applications/:index', requireAuth, (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const { name, username, password, url } = req.body;
        
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                error: 'Índice inválido',
                code: 'INVALID_INDEX',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }

        const success = ConfigService.updateApplication(index, { name, username, password, url });
        
        if (success) {
            const applications = ConfigService.getApplications();
            res.json({
                message: 'Aplicação atualizada com sucesso',
                applications: applications,
                timestamp: new Date().toLocaleString('pt-BR')
            });
        } else {
            res.status(400).json({
                error: 'Erro ao atualizar aplicação',
                code: 'UPDATE_ERROR',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ 
            error: 'Erro interno ao atualizar aplicação',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * PUT /api/status/subdomain
 * Update global subdomain (protected route)
 */
router.put('/subdomain', requireAuth, (req, res) => {
    try {
        const { subdomain } = req.body;
        
        if (!subdomain || typeof subdomain !== 'string' || subdomain.trim() === '') {
            return res.status(400).json({
                error: 'Subdomínio inválido',
                code: 'INVALID_SUBDOMAIN',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }

        const success = ConfigService.updateSubdomain(subdomain.trim());
        
        if (success) {
            const applications = ConfigService.getApplications();
            res.json({
                message: 'Subdomínio atualizado com sucesso',
                subdomain: subdomain.trim(),
                applications: applications,
                timestamp: new Date().toLocaleString('pt-BR')
            });
        } else {
            res.status(400).json({
                error: 'Erro ao atualizar subdomínio',
                code: 'UPDATE_ERROR',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
    } catch (error) {
        console.error('Update subdomain error:', error);
        res.status(500).json({ 
            error: 'Erro interno ao atualizar subdomínio',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * POST /api/status/applications
 * Add new application (protected route)
 */
router.post('/applications', requireAuth, (req, res) => {
    try {
        const { name, className, subdomain, username, password } = req.body;
        
        // Validate required fields
        if (!name || !subdomain || !username || !password) {
            return res.status(400).json({
                error: 'Todos os campos são obrigatórios (name, subdomain, username, password)',
                code: 'MISSING_FIELDS',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }

        // Validate field types and lengths
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                error: 'Nome da aplicação inválido',
                code: 'INVALID_NAME',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }

        if (typeof subdomain !== 'string' || subdomain.trim() === '') {
            return res.status(400).json({
                error: 'Subdomínio da aplicação inválido',
                code: 'INVALID_SUBDOMAIN',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }

        const success = ConfigService.addApplication({
            name: name.trim(),
            className: className?.trim() || 'default',
            subdomain: subdomain.trim(),
            username: username.trim(),
            password: password.trim()
        });
        
        if (success) {
            const applications = ConfigService.getApplications();
            res.json({
                message: 'Aplicação adicionada com sucesso',
                applications: applications,
                timestamp: new Date().toLocaleString('pt-BR')
            });
        } else {
            res.status(400).json({
                error: 'Erro ao adicionar aplicação',
                code: 'ADD_ERROR',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
    } catch (error) {
        console.error('Add application error:', error);
        res.status(500).json({ 
            error: 'Erro interno ao adicionar aplicação',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * DELETE /api/status/applications/:index
 * Remove application by index (protected route)
 */
router.delete('/applications/:index', requireAuth, (req, res) => {
    try {
        const index = parseInt(req.params.index);
        
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                error: 'Índice inválido',
                code: 'INVALID_INDEX',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }

        const success = ConfigService.removeApplication(index);
        
        if (success) {
            const applications = ConfigService.getApplications();
            res.json({
                message: 'Aplicação removida com sucesso',
                applications: applications,
                timestamp: new Date().toLocaleString('pt-BR')
            });
        } else {
            res.status(400).json({
                error: 'Erro ao remover aplicação ou índice não encontrado',
                code: 'REMOVE_ERROR',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
    } catch (error) {
        console.error('Remove application error:', error);
        res.status(500).json({ 
            error: 'Erro interno ao remover aplicação',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * GET /api/status/version
 * Get current application version (unprotected)
 */
router.get('/version', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Read version from package.json
        const packagePath = path.join(__dirname, '../../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        res.json({
            version: packageJson.version,
            name: packageJson.name,
            timestamp: new Date().toLocaleString('pt-BR')
        });
    } catch (error) {
        console.error('Version error:', error);
        res.status(500).json({
            error: 'Erro ao obter versão',
            code: 'VERSION_ERROR',
            version: '1.0.0' // fallback version
        });
    }
});

module.exports = router;
