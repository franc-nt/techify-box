/**
 * Update Service
 * Handles version checking and update management
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class UpdateService {
    constructor() {
        this.githubRepo = 'franc-nt/techify-box';
        this.githubApiUrl = `https://api.github.com/repos/${this.githubRepo}`;
        this.packageJsonPath = path.join(__dirname, '../../package.json');
    }

    /**
     * Get current version from package.json
     * @returns {string} Current version
     */
    getCurrentVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            return packageJson.version;
        } catch (error) {
            console.error('❌ Erro ao ler versão atual:', error);
            return '1.0.0'; // fallback
        }
    }

    /**
     * Get latest release from GitHub
     * @returns {Promise<Object>} Latest release data
     */
    async getLatestRelease() {
        try {
            console.log('🔍 Verificando última release no GitHub...');
            
            const response = await axios.get(`${this.githubApiUrl}/releases/latest`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Techify-Box-Updater'
                }
            });
            
            const release = response.data;
            
            return {
                version: release.tag_name.replace(/^v/, ''), // Remove 'v' prefix if present
                name: release.name,
                description: release.body,
                published_at: release.published_at,
                assets: release.assets.map(asset => ({
                    name: asset.name,
                    download_url: asset.browser_download_url,
                    size: asset.size
                })),
                prerelease: release.prerelease,
                draft: release.draft
            };
            
        } catch (error) {
            console.error('❌ Erro ao buscar release:', error.message);
            
            if (error.response?.status === 404) {
                throw new Error('Nenhuma release encontrada no repositório');
            }
            
            if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                throw new Error('Não foi possível conectar ao GitHub. Verifique sua conexão de internet.');
            }
            
            throw new Error(`Erro ao verificar atualizações: ${error.message}`);
        }
    }

    /**
     * Compare two version strings
     * @param {string} version1 - First version
     * @param {string} version2 - Second version  
     * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
     */
    compareVersions(version1, version2) {
        // Remove 'v' prefix if present
        const v1 = version1.replace(/^v/, '');
        const v2 = version2.replace(/^v/, '');
        
        const parts1 = v1.split('.').map(n => parseInt(n, 10));
        const parts2 = v2.split('.').map(n => parseInt(n, 10));
        
        const maxLength = Math.max(parts1.length, parts2.length);
        
        for (let i = 0; i < maxLength; i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 < part2) return -1;
            if (part1 > part2) return 1;
        }
        
        return 0;
    }

    /**
     * Check if update is available
     * @returns {Promise<Object>} Update check result
     */
    async checkForUpdates() {
        try {
            const currentVersion = this.getCurrentVersion();
            const latestRelease = await this.getLatestRelease();
            
            const hasUpdate = this.compareVersions(currentVersion, latestRelease.version) < 0;
            
            const result = {
                currentVersion,
                latestVersion: latestRelease.version,
                hasUpdate,
                updateInfo: hasUpdate ? {
                    version: latestRelease.version,
                    name: latestRelease.name,
                    description: latestRelease.description,
                    publishedAt: latestRelease.published_at,
                    assets: latestRelease.assets,
                    prerelease: latestRelease.prerelease
                } : null,
                checkedAt: new Date().toISOString()
            };
            
            console.log(hasUpdate ? 
                `✅ Atualização disponível: ${currentVersion} → ${latestRelease.version}` : 
                `✅ Aplicação atualizada (${currentVersion})`
            );
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro na verificação de atualizações:', error);
            
            return {
                currentVersion: this.getCurrentVersion(),
                latestVersion: null,
                hasUpdate: false,
                error: error.message,
                checkedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Get update manifest from release assets
     * @param {Array} assets - Release assets
     * @returns {Promise<Object>} Update manifest
     */
    async getUpdateManifest(assets) {
        try {
            const manifestAsset = assets.find(asset => 
                asset.name === 'update-manifest.json'
            );
            
            if (!manifestAsset) {
                // Return default manifest if not found
                return {
                    type: 'standard',
                    requires_restart: true,
                    requires_npm_install: false,
                    backup_required: true,
                    pre_scripts: [],
                    post_scripts: []
                };
            }
            
            const response = await axios.get(manifestAsset.download_url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Techify-Box-Updater'
                }
            });
            
            return response.data;
            
        } catch (error) {
            console.warn('⚠️ Erro ao carregar manifesto, usando padrão:', error.message);
            
            // Return default manifest on error
            return {
                type: 'standard',
                requires_restart: true,
                requires_npm_install: false,
                backup_required: true,
                pre_scripts: [],
                post_scripts: []
            };
        }
    }

    /**
     * Validate if system can perform update
     * @returns {Promise<Object>} Validation result
     */
    async validateUpdateRequirements() {
        const requirements = {
            hasGit: false,
            hasInternet: false,
            hasSpace: false,
            hasPermissions: false,
            gitInstalled: false,
            errors: []
        };
        
        try {
            // Check if git is available, install if not
            const { exec } = require('child_process');
            await new Promise((resolve, reject) => {
                exec('git --version', (error, stdout) => {
                    if (error) {
                        // Git not found, try to install it
                        this.installGitIfNeeded()
                            .then(() => {
                                requirements.hasGit = true;
                                requirements.gitInstalled = true;
                                resolve(stdout);
                            })
                            .catch(installError => {
                                requirements.errors.push('Git não pôde ser instalado automaticamente');
                                reject(installError);
                            });
                    } else {
                        requirements.hasGit = true;
                        resolve(stdout);
                    }
                });
            });
        } catch (error) {
            requirements.errors.push('Git não encontrado e não pôde ser instalado');
        }
        
        try {
            // Test internet connectivity
            await axios.get('https://api.github.com', { timeout: 5000 });
            requirements.hasInternet = true;
        } catch (error) {
            requirements.errors.push('Sem conexão com a internet');
        }
        
        try {
            // Check disk space (simplified check)
            const stats = fs.statSync(__dirname);
            requirements.hasSpace = true; // Assume OK for now
        } catch (error) {
            requirements.errors.push('Erro ao verificar espaço em disco');
        }
        
        try {
            // Check write permissions
            const testFile = path.join(__dirname, '../../.update-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            requirements.hasPermissions = true;
        } catch (error) {
            requirements.errors.push('Sem permissões de escrita');
        }
        
        const canUpdate = requirements.hasGit && 
                         requirements.hasInternet && 
                         requirements.hasSpace && 
                         requirements.hasPermissions;
        
        return {
            ...requirements,
            canUpdate
        };
    }

    /**
     * Install Git if needed using setup script
     * @returns {Promise<void>}
     */
    async installGitIfNeeded() {
        const path = require('path');
        const { spawn } = require('child_process');
        
        const setupScriptPath = path.join(__dirname, '../../scripts/setup-git.sh');
        
        return new Promise((resolve, reject) => {
            console.log('🔄 Instalando Git automaticamente...');
            
            const process = spawn('bash', [setupScriptPath], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log(data.toString().trim());
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error(data.toString().trim());
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Git instalado com sucesso');
                    resolve();
                } else {
                    console.error(`❌ Falha ao instalar Git (código: ${code})`);
                    reject(new Error(`Git installation failed with code ${code}`));
                }
            });
        });
    }
}

module.exports = new UpdateService();