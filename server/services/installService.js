/**
 * Install Service
 * Handles the actual installation of updates
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawn, exec } = require('child_process');
const archiver = require('archiver');
const extract = require('extract-zip');

class InstallService {
    constructor() {
        this.baseDir = path.join(__dirname, '../..');
        this.backupDir = path.join(this.baseDir, 'backups');
        this.tempDir = path.join(this.baseDir, 'temp');
        this.logFile = path.join(this.baseDir, 'logs', 'update.log');
        
        this.installState = {
            status: 'idle', // idle, running, success, error
            progress: 0,
            currentStep: '',
            error: null,
            startTime: null,
            endTime: null,
            version: null
        };
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        const dirs = [this.backupDir, this.tempDir, path.dirname(this.logFile)];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Get current installation status
     */
    getStatus() {
        return {
            ...this.installState,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Log message to file and console
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        console.log(logMessage);
        
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Update installation state
     */
    updateState(updates) {
        this.installState = { ...this.installState, ...updates };
        this.log(`State updated: ${JSON.stringify(updates)}`);
    }

    /**
     * Start update installation process
     */
    async startInstallation(updateInfo) {
        if (this.installState.status === 'running') {
            throw new Error('Uma atualização já está em progresso');
        }

        this.updateState({
            status: 'running',
            progress: 0,
            currentStep: 'Iniciando atualização...',
            error: null,
            startTime: new Date().toISOString(),
            endTime: null,
            version: updateInfo.version
        });

        try {
            this.log(`Starting update installation to version ${updateInfo.version}`);
            
            // Step 1: Create backup
            await this.createBackup();
            
            // Step 2: Download update files
            await this.downloadUpdateFiles(updateInfo);
            
            // Step 3: Extract and validate files
            await this.extractUpdateFiles();
            
            // Step 4: Run pre-update scripts
            await this.runPreUpdateScripts();
            
            // Step 5: Apply updates
            await this.applyUpdates();
            
            // Step 6: Run post-update scripts
            await this.runPostUpdateScripts();
            
            // Step 7: Update package.json version
            await this.updateVersion(updateInfo.version);
            
            // Step 8: Restart services
            await this.restartServices();
            
            // Step 9: Cleanup
            await this.cleanup();
            
            this.updateState({
                status: 'success',
                progress: 100,
                currentStep: 'Atualização concluída com sucesso!',
                endTime: new Date().toISOString()
            });
            
            this.log(`Update installation completed successfully to version ${updateInfo.version}`);
            
            return {
                success: true,
                message: 'Atualização instalada com sucesso'
            };
            
        } catch (error) {
            this.log(`Update installation failed: ${error.message}`, 'error');
            
            this.updateState({
                status: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            
            // Attempt rollback
            try {
                await this.rollback();
            } catch (rollbackError) {
                this.log(`Rollback failed: ${rollbackError.message}`, 'error');
            }
            
            throw error;
        }
    }

    /**
     * Create backup of current installation
     */
    async createBackup() {
        this.updateState({
            progress: 10,
            currentStep: 'Criando backup...'
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}.zip`);
        
        this.log('Creating backup of current installation');
        
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                this.log(`Backup created: ${backupPath} (${archive.pointer()} bytes)`);
                this.currentBackupPath = backupPath;
                resolve();
            });
            
            archive.on('error', (err) => {
                this.log(`Backup creation failed: ${err.message}`, 'error');
                reject(err);
            });
            
            archive.pipe(output);
            
            // Add important files and directories to backup
            const filesToBackup = [
                'package.json',
                'config.json',
                'ecosystem.config.js',
                'server/',
                'public/',
                'scripts/'
            ];
            
            filesToBackup.forEach(item => {
                const fullPath = path.join(this.baseDir, item);
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                        archive.directory(fullPath, item);
                    } else {
                        archive.file(fullPath, { name: item });
                    }
                }
            });
            
            archive.finalize();
        });
    }

    /**
     * Download update files from GitHub release
     */
    async downloadUpdateFiles(updateInfo) {
        this.updateState({
            progress: 30,
            currentStep: 'Baixando arquivos de atualização...'
        });
        
        this.log(`Downloading update files for version ${updateInfo.version}`);
        
        // Look for main update file (usually files.tar.gz or similar)
        const updateAsset = updateInfo.assets.find(asset => 
            asset.name.includes('files') || 
            asset.name.includes('update') ||
            asset.name.endsWith('.tar.gz') ||
            asset.name.endsWith('.zip')
        );
        
        if (!updateAsset) {
            throw new Error('Arquivo de atualização não encontrado na release');
        }
        
        const downloadPath = path.join(this.tempDir, updateAsset.name);
        
        try {
            const response = await axios({
                method: 'get',
                url: updateAsset.download_url,
                responseType: 'stream',
                timeout: 300000, // 5 minutes timeout
                headers: {
                    'User-Agent': 'Techify-Box-Updater'
                }
            });
            
            const writer = fs.createWriteStream(downloadPath);
            
            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                
                let downloadedBytes = 0;
                const totalBytes = parseInt(response.headers['content-length'] || '0');
                
                response.data.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (totalBytes > 0) {
                        const progress = Math.min(30 + (downloadedBytes / totalBytes) * 20, 50);
                        this.updateState({ progress });
                    }
                });
                
                writer.on('finish', () => {
                    this.updateFilePath = downloadPath;
                    this.log(`Downloaded update file: ${downloadPath}`);
                    resolve();
                });
                
                writer.on('error', reject);
                response.data.on('error', reject);
            });
            
        } catch (error) {
            throw new Error(`Falha no download: ${error.message}`);
        }
    }

    /**
     * Extract update files
     */
    async extractUpdateFiles() {
        this.updateState({
            progress: 55,
            currentStep: 'Extraindo arquivos...'
        });
        
        const extractPath = path.join(this.tempDir, 'extracted');
        
        // Ensure extract directory exists
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }
        
        this.log('Extracting update files');
        
        try {
            if (this.updateFilePath.endsWith('.zip')) {
                await extract(this.updateFilePath, { dir: extractPath });
            } else if (this.updateFilePath.endsWith('.tar.gz')) {
                await this.extractTarGz(this.updateFilePath, extractPath);
            } else {
                throw new Error('Formato de arquivo não suportado');
            }
            
            this.extractedPath = extractPath;
            this.log('Update files extracted successfully');
            
        } catch (error) {
            throw new Error(`Falha na extração: ${error.message}`);
        }
    }

    /**
     * Extract tar.gz file
     */
    extractTarGz(filePath, extractPath) {
        return new Promise((resolve, reject) => {
            const command = `tar -xzf "${filePath}" -C "${extractPath}"`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Tar extraction failed: ${error.message}`));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Run pre-update scripts
     */
    async runPreUpdateScripts() {
        this.updateState({
            progress: 60,
            currentStep: 'Executando scripts de pré-atualização...'
        });
        
        const preScriptPath = path.join(this.extractedPath, 'pre-update.sh');
        
        if (fs.existsSync(preScriptPath)) {
            this.log('Running pre-update script');
            await this.executeScript(preScriptPath);
        } else {
            this.log('No pre-update script found, skipping');
        }
    }

    /**
     * Apply updates by copying files
     */
    async applyUpdates() {
        this.updateState({
            progress: 75,
            currentStep: 'Aplicando atualizações...'
        });
        
        this.log('Applying updates');
        
        const manifestPath = path.join(this.extractedPath, 'update-manifest.json');
        let manifest = {};
        
        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }
        
        // Copy files from extracted directory to base directory
        await this.copyUpdateFiles(this.extractedPath, this.baseDir, manifest);
        
        // Install npm packages if needed
        if (manifest.requires_npm_install) {
            this.log('Running npm install');
            await this.runNpmInstall();
        }
    }

    /**
     * Copy update files
     */
    async copyUpdateFiles(sourceDir, targetDir, manifest) {
        const filesToUpdate = manifest.files_to_update || [];
        const filesToPreserve = manifest.files_to_preserve || ['config.json', 'logs/', 'backups/', 'temp/'];
        
        // If specific files are listed, update only those
        if (filesToUpdate.length > 0) {
            for (const file of filesToUpdate) {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);
                
                if (fs.existsSync(sourcePath)) {
                    await this.copyFileOrDirectory(sourcePath, targetPath);
                    this.log(`Updated: ${file}`);
                }
            }
        } else {
            // Otherwise, copy all files except preserved ones
            await this.copyDirectoryContents(sourceDir, targetDir, filesToPreserve);
        }
    }

    /**
     * Copy file or directory recursively
     */
    async copyFileOrDirectory(source, target) {
        const stats = fs.statSync(source);
        
        if (stats.isDirectory()) {
            if (!fs.existsSync(target)) {
                fs.mkdirSync(target, { recursive: true });
            }
            
            const files = fs.readdirSync(source);
            for (const file of files) {
                await this.copyFileOrDirectory(
                    path.join(source, file),
                    path.join(target, file)
                );
            }
        } else {
            // Ensure target directory exists
            const targetDir = path.dirname(target);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            fs.copyFileSync(source, target);
        }
    }

    /**
     * Copy directory contents excluding preserved files
     */
    async copyDirectoryContents(sourceDir, targetDir, preserveList) {
        const files = fs.readdirSync(sourceDir);
        
        for (const file of files) {
            // Skip preserved files/directories
            if (preserveList.some(preserve => file.startsWith(preserve.replace('/', '')))) {
                continue;
            }
            
            // Skip meta files
            if (['update-manifest.json', 'pre-update.sh', 'post-update.sh'].includes(file)) {
                continue;
            }
            
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            
            await this.copyFileOrDirectory(sourcePath, targetPath);
            this.log(`Updated: ${file}`);
        }
    }

    /**
     * Run post-update scripts
     */
    async runPostUpdateScripts() {
        this.updateState({
            progress: 85,
            currentStep: 'Executando scripts de pós-atualização...'
        });
        
        const postScriptPath = path.join(this.extractedPath, 'post-update.sh');
        
        if (fs.existsSync(postScriptPath)) {
            this.log('Running post-update script');
            await this.executeScript(postScriptPath);
        } else {
            this.log('No post-update script found, skipping');
        }
    }

    /**
     * Execute shell script
     */
    executeScript(scriptPath) {
        return new Promise((resolve, reject) => {
            // Make script executable
            fs.chmodSync(scriptPath, 0o755);
            
            const process = spawn('bash', [scriptPath], {
                cwd: this.baseDir,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    this.log(`Script executed successfully: ${scriptPath}`);
                    if (stdout) this.log(`Script output: ${stdout}`);
                    resolve();
                } else {
                    this.log(`Script failed with code ${code}: ${scriptPath}`, 'error');
                    if (stderr) this.log(`Script error: ${stderr}`, 'error');
                    reject(new Error(`Script execution failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Update package.json version
     */
    async updateVersion(newVersion) {
        this.updateState({
            progress: 90,
            currentStep: 'Atualizando versão...'
        });
        
        const packageJsonPath = path.join(this.baseDir, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            packageJson.version = newVersion;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            this.log(`Updated package.json version to ${newVersion}`);
        }
    }

    /**
     * Run npm install
     */
    runNpmInstall() {
        return new Promise((resolve, reject) => {
            const process = spawn('npm', ['install'], {
                cwd: this.baseDir,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    this.log('npm install completed successfully');
                    resolve();
                } else {
                    this.log(`npm install failed with code ${code}`, 'error');
                    if (stderr) this.log(`npm error: ${stderr}`, 'error');
                    reject(new Error(`npm install failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Restart services
     */
    async restartServices() {
        this.updateState({
            progress: 95,
            currentStep: 'Reiniciando serviços...'
        });
        
        this.log('Restarting services');
        
        try {
            // Try to restart with PM2 first
            await this.restartWithPM2();
        } catch (error) {
            this.log(`PM2 restart failed: ${error.message}`, 'warn');
            // Fallback to process exit (systemd or other process manager will restart)
            this.log('Falling back to process restart');
            setTimeout(() => {
                process.exit(0);
            }, 2000);
        }
    }

    /**
     * Restart with PM2
     */
    restartWithPM2() {
        return new Promise((resolve, reject) => {
            exec('pm2 restart local-app', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    this.log('Services restarted with PM2');
                    resolve();
                }
            });
        });
    }

    /**
     * Cleanup temporary files
     */
    async cleanup() {
        this.updateState({
            progress: 100,
            currentStep: 'Limpando arquivos temporários...'
        });
        
        this.log('Cleaning up temporary files');
        
        try {
            if (fs.existsSync(this.tempDir)) {
                await this.removeDirectory(this.tempDir);
            }
        } catch (error) {
            this.log(`Cleanup failed: ${error.message}`, 'warn');
        }
    }

    /**
     * Remove directory recursively
     */
    async removeDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    await this.removeDirectory(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            
            fs.rmdirSync(dirPath);
        }
    }

    /**
     * Rollback to previous version
     */
    async rollback() {
        if (!this.currentBackupPath || !fs.existsSync(this.currentBackupPath)) {
            throw new Error('Backup file not found for rollback');
        }
        
        this.log('Starting rollback process');
        
        try {
            // Extract backup
            const rollbackPath = path.join(this.tempDir, 'rollback');
            if (!fs.existsSync(rollbackPath)) {
                fs.mkdirSync(rollbackPath, { recursive: true });
            }
            
            await extract(this.currentBackupPath, { dir: rollbackPath });
            
            // Restore files
            await this.copyDirectoryContents(rollbackPath, this.baseDir, []);
            
            this.log('Rollback completed successfully');
            
        } catch (error) {
            this.log(`Rollback failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

module.exports = new InstallService();