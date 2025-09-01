/**
 * Configuration Service
 * Handles reading and writing to config.json file
 */

const fs = require('fs');
const config = require('../config/environment');

class ConfigService {
    /**
     * Read configuration from config.json
     * @returns {Object} Configuration object
     */
    static readConfig() {
        try {
            const configContent = fs.readFileSync(config.files.config, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.error('Erro ao ler config.json:', error);
            return { 
                subdomain: 'erro-ao-ler-config',
                password: null,
                applications: []
            };
        }
    }

    /**
     * Write configuration to config.json
     * @param {Object} configData - Configuration data to write
     * @returns {boolean} Success status
     */
    static writeConfig(configData) {
        try {
            fs.writeFileSync(config.files.config, JSON.stringify(configData, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Erro ao escrever config.json:', error);
            return false;
        }
    }

    /**
     * Get subdomain from configuration
     * @returns {string} Subdomain value
     */
    static getSubdomain() {
        const configData = this.readConfig();
        return configData.subdomain || 'subdomain-não-encontrado';
    }

    /**
     * Check if password is set in configuration
     * @returns {boolean} Password status
     */
    static hasPassword() {
        const configData = this.readConfig();
        return !!configData.password;
    }

    /**
     * Get password hash from configuration
     * @returns {string|null} Password hash or null
     */
    static getPasswordHash() {
        const configData = this.readConfig();
        return configData.password || null;
    }

    /**
     * Update password in configuration
     * @param {string} passwordHash - Hashed password
     * @returns {boolean} Success status
     */
    static updatePassword(passwordHash) {
        const configData = this.readConfig();
        configData.password = passwordHash;
        return this.writeConfig(configData);
    }

    /**
     * Remove password from configuration
     * @returns {boolean} Success status
     */
    static removePassword() {
        const configData = this.readConfig();
        delete configData.password;
        return this.writeConfig(configData);
    }

    /**
     * Get applications from configuration with URLs resolved
     * @returns {Array} Applications array with resolved URLs
     */
    static getApplications() {
        const configData = this.readConfig();
        const subdomain = configData.subdomain || 'subdomain-not-found';
        
        return (configData.applications || []).map(app => ({
            ...app,
            url: app.url.replace('{subdomain}', subdomain)
        }));
    }

    /**
     * Get full configuration with resolved URLs
     * @returns {Object} Full configuration with resolved applications
     */
    static getFullConfig() {
        const configData = this.readConfig();
        return {
            ...configData,
            applications: this.getApplications()
        };
    }

    /**
     * Update specific application by index
     * @param {number} index - Application index
     * @param {Object} updates - Object with fields to update (name, username, password, url)
     * @returns {boolean} Success status
     */
    static updateApplication(index, updates) {
        try {
            const configData = this.readConfig();
            
            if (!configData.applications || index < 0 || index >= configData.applications.length) {
                console.error('Invalid application index:', index);
                return false;
            }

            const application = configData.applications[index];

            // Update application fields if provided
            if (updates.name !== undefined) {
                application.name = updates.name;
            }
            if (updates.username !== undefined) {
                application.username = updates.username;
            }
            if (updates.password !== undefined) {
                application.password = updates.password;
            }
            if (updates.url !== undefined) {
                application.url = updates.url;
            }

            return this.writeConfig(configData);
        } catch (error) {
            console.error('Error updating application:', error);
            return false;
        }
    }

    /**
     * Update subdomain in configuration
     * @param {string} newSubdomain - New subdomain value
     * @returns {boolean} Success status
     */
    static updateSubdomain(newSubdomain) {
        try {
            const configData = this.readConfig();
            configData.subdomain = newSubdomain;
            return this.writeConfig(configData);
        } catch (error) {
            console.error('Error updating subdomain:', error);
            return false;
        }
    }

    /**
     * Add new application to configuration
     * @param {Object} applicationData - Application data (name, className, subdomain, username, password)
     * @returns {boolean} Success status
     */
    static addApplication(applicationData) {
        try {
            console.log('📦 DEBUG - Dados recebidos no addApplication:', JSON.stringify(applicationData, null, 2));
            
            const configData = this.readConfig();
            
            if (!configData.applications) {
                configData.applications = [];
            }

            // Validar se o subdomain foi fornecido
            if (!applicationData.subdomain || applicationData.subdomain.trim() === '') {
                console.error('❌ Subdomínio não fornecido ou vazio');
                return false;
            }

            // Use the subdomain from applicationData for the URL (prioritize user input)
            const appSubdomain = applicationData.subdomain.trim();
            console.log('🔗 DEBUG - appSubdomain usado:', appSubdomain);
            console.log('🔗 DEBUG - applicationData.subdomain:', applicationData.subdomain);
            console.log('🔗 DEBUG - applicationData.className:', applicationData.className);
            
            // Create URL with the actual subdomain provided by user
            const newApplication = {
                name: applicationData.name,
                className: applicationData.className || 'default',
                url: `https://${appSubdomain}.{subdomain}.techify.free`,
                username: applicationData.username,
                password: applicationData.password
            };

            console.log('🚀 DEBUG - Nova aplicação criada:', JSON.stringify(newApplication, null, 2));

            configData.applications.push(newApplication);
            return this.writeConfig(configData);
        } catch (error) {
            console.error('Error adding application:', error);
            return false;
        }
    }

    /**
     * Remove application from configuration by index
     * @param {number} index - Application index to remove
     * @returns {boolean} Success status
     */
    static removeApplication(index) {
        try {
            const configData = this.readConfig();
            
            if (!configData.applications || index < 0 || index >= configData.applications.length) {
                console.error('Invalid application index or no applications array:', index);
                return false;
            }

            configData.applications.splice(index, 1);
            return this.writeConfig(configData);
        } catch (error) {
            console.error('Error removing application:', error);
            return false;
        }
    }
}

module.exports = ConfigService;
