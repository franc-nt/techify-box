/**
 * Updates Routes
 * Handles update checking and management endpoints
 */

const express = require('express');
const router = express.Router();
const UpdateService = require('../services/updateService');
const InstallService = require('../services/installService');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/updates/check
 * Check for available updates (protected route)
 */
router.get('/check', requireAuth, async (req, res) => {
    try {
        console.log('🔍 Verificando atualizações...');
        
        const updateCheck = await UpdateService.checkForUpdates();
        
        res.json({
            success: true,
            data: updateCheck,
            timestamp: new Date().toLocaleString('pt-BR')
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar atualizações:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar atualizações',
            details: error.message,
            code: 'UPDATE_CHECK_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * GET /api/updates/version
 * Get current version info (protected route)
 */
router.get('/version', requireAuth, async (req, res) => {
    try {
        const currentVersion = UpdateService.getCurrentVersion();
        
        res.json({
            success: true,
            data: {
                currentVersion,
                repository: 'franc-nt/techify-box',
                checkedAt: new Date().toISOString()
            },
            timestamp: new Date().toLocaleString('pt-BR')
        });
        
    } catch (error) {
        console.error('❌ Erro ao obter versão:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro ao obter informações de versão',
            details: error.message,
            code: 'VERSION_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * GET /api/updates/requirements
 * Check if system meets update requirements (protected route)
 */
router.get('/requirements', requireAuth, async (req, res) => {
    try {
        console.log('🔧 Validando requisitos para atualização...');
        
        const requirements = await UpdateService.validateUpdateRequirements();
        
        res.json({
            success: true,
            data: requirements,
            timestamp: new Date().toLocaleString('pt-BR')
        });
        
    } catch (error) {
        console.error('❌ Erro ao validar requisitos:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro ao validar requisitos de atualização',
            details: error.message,
            code: 'REQUIREMENTS_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * POST /api/updates/install
 * Start update installation process (protected route)
 */
router.post('/install', requireAuth, async (req, res) => {
    try {
        console.log('🚀 Iniciando processo de instalação de atualização...');
        
        // Check if an installation is already running
        const currentStatus = InstallService.getStatus();
        if (currentStatus.status === 'running') {
            return res.status(409).json({
                success: false,
                error: 'Uma atualização já está em progresso',
                code: 'INSTALLATION_IN_PROGRESS',
                data: currentStatus,
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
        
        // Get latest update info
        const updateCheck = await UpdateService.checkForUpdates();
        
        if (!updateCheck.hasUpdate) {
            return res.status(400).json({
                success: false,
                error: 'Nenhuma atualização disponível',
                code: 'NO_UPDATE_AVAILABLE',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
        
        // Validate system requirements
        const requirements = await UpdateService.validateUpdateRequirements();
        if (!requirements.canUpdate) {
            return res.status(400).json({
                success: false,
                error: 'Requisitos do sistema não atendidos',
                code: 'REQUIREMENTS_NOT_MET',
                data: requirements,
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
        
        // Start installation asynchronously
        setImmediate(async () => {
            try {
                await InstallService.startInstallation(updateCheck.updateInfo);
            } catch (installError) {
                console.error('❌ Erro durante instalação:', installError);
            }
        });
        
        res.json({
            success: true,
            message: 'Processo de instalação iniciado',
            data: InstallService.getStatus(),
            timestamp: new Date().toLocaleString('pt-BR')
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar instalação:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro ao iniciar processo de instalação',
            details: error.message,
            code: 'INSTALL_START_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * GET /api/updates/status
 * Get update installation status (protected route)
 */
router.get('/status', requireAuth, async (req, res) => {
    try {
        const status = InstallService.getStatus();
        
        res.json({
            success: true,
            data: {
                status: status.status,
                progress: status.progress,
                currentStep: status.currentStep,
                error: status.error,
                startTime: status.startTime,
                endTime: status.endTime,
                version: status.version,
                message: status.currentStep || 'Status da instalação obtido com sucesso'
            },
            timestamp: new Date().toLocaleString('pt-BR')
        });
        
    } catch (error) {
        console.error('❌ Erro ao obter status:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro ao obter status da atualização',
            details: error.message,
            code: 'STATUS_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

/**
 * POST /api/updates/rollback
 * Rollback to previous version (protected route)
 */
router.post('/rollback', requireAuth, async (req, res) => {
    try {
        console.log('🔄 Iniciando processo de rollback...');
        
        const currentStatus = InstallService.getStatus();
        if (currentStatus.status === 'running') {
            return res.status(409).json({
                success: false,
                error: 'Não é possível fazer rollback durante uma instalação',
                code: 'INSTALLATION_IN_PROGRESS',
                timestamp: new Date().toLocaleString('pt-BR')
            });
        }
        
        await InstallService.rollback();
        
        res.json({
            success: true,
            message: 'Rollback executado com sucesso',
            timestamp: new Date().toLocaleString('pt-BR')
        });
        
    } catch (error) {
        console.error('❌ Erro no rollback:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro durante o rollback',
            details: error.message,
            code: 'ROLLBACK_ERROR',
            timestamp: new Date().toLocaleString('pt-BR')
        });
    }
});

module.exports = router;