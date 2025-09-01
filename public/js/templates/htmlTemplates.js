/**
 * HTML Templates
 * Centralized HTML template management
 */

const HtmlTemplates = {
    /**
     * Authentication UI template
     * @param {boolean} hasPassword - Whether password is already set
     * @returns {string} HTML template
     */
    getAuthTemplate(hasPassword) {
        return `
            <h1 class="title">Techify Free Tools</h1>
            
            <div class="auth-container">
                ${!hasPassword ? `
                    <div class="auth-section">
                        <h3>Configurar Senha</h3>
                        <p>Defina uma senha para proteger o acesso à aplicação (opcional):</p>
                        <div class="form-group">
                            <input type="password" id="new-password" placeholder="Nova senha (min. 4 caracteres)" />
                            <button id="btn-set-password" class="${window.CONFIG.CSS_CLASSES.BTN_PRIMARY}">
                                Definir Senha
                            </button>
                            <button id="btn-skip-password" class="${window.CONFIG.CSS_CLASSES.BTN_SECONDARY}">
                                Pular (Sem Senha)
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="auth-section">
                        <h3>Login Necessário</h3>
                        <p>Digite a senha para acessar a aplicação:</p>
                        <div class="form-group">
                            <input type="password" id="login-password" placeholder="Senha" />
                            <button id="btn-login" class="${window.CONFIG.CSS_CLASSES.BTN_PRIMARY}">
                                Entrar
                            </button>
                        </div>
                        <div id="login-error" class="error-message"></div>
                    </div>
                `}
            </div>
        `;
    },

    /**
     * Main application UI template
     * @param {boolean} hasPassword - Whether password is set
     * @param {Array} applications - Array of applications from config
     * @param {string} subdomain - Current subdomain
     * @returns {string} HTML template  
     */
    getMainTemplate(hasPassword, applications = [], subdomain = '') {
        return `
            <div class="header-section">
                <div class="title-container">
                    <h1 class="title">Techify Free Tools</h1>
                    <p class="subtitle">Painel de controle para seus serviços e ferramentas</p>
                </div>
                <div class="header-buttons">
                    ${hasPassword ? `
                        <button id="btn-change-password" class="config-btn">Alterar Senha</button>
                        <button id="btn-remove-password" class="config-btn secondary">Remover Senha</button>
                        <button id="btn-logout" class="config-btn secondary">Logout</button>
                    ` : `
                        <button id="btn-configure-password" class="config-btn">Configurar Senha</button>
                    `}
                </div>
            </div>
            
            <div class="content-grid">
                <div class="tests-section">
                    <h2>Testes</h2>
                    <div class="tests-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Recurso</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="tests-tbody">
                                <tr>
                                    <td>Internet</td>
                                    <td><span id="test-internet" class="status-badge status-loading">🔄 Testando...</span></td>
                                </tr>
                                <tr>
                                    <td>Servidor Techify</td>
                                    <td><span id="test-techify-server" class="status-badge status-loading">🔄 Testando...</span></td>
                                </tr>
                                <tr>
                                    <td>Subdomínio</td>
                                    <td><span id="test-subdomain" class="status-badge status-loading">🔄 Testando...</span></td>
                                </tr>
                                <tr>
                                    <td>Túnel</td>
                                    <td><span id="test-tunnel" class="status-badge status-loading">🔄 Testando...</span></td>
                                </tr>
                                <tr>
                                    <td>Acesso Externo</td>
                                    <td><span id="test-external" class="status-badge status-loading">🔄 Testando...</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="services-section">
                    <div class="services-header">
                        <h2>Serviços Disponíveis</h2>
                        ${subdomain !== 'waiting' ? `
                            <div class="services-controls">
                                <button id="add-application" class="add-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Adicionar Aplicação
                                </button>
                                <button id="toggle-passwords" class="toggle-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Mostrar Senhas
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    ${subdomain === 'waiting' ? this.getWaitingTemplate() : `
                        <div class="services-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Serviço</th>
                                        <th>URL</th>
                                        <th>Usuário</th>
                                        <th>Senha</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="services-tbody">
                                    ${this.getServicesTableRows(applications)}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="timestamp" id="timestamp">Carregando...</div>
            
            <!-- Version Info -->
            <div class="version-info">
                <span id="app-version" class="version-badge">
                    <span class="version-icon">🏷️</span>
                    <span id="version-text">Carregando versão...</span>
                </span>
            </div>
            
            <!-- Add Application Modal -->
            ${this.getAddApplicationModalTemplate()}
            
            <!-- Edit Application Modal -->
            ${this.getEditApplicationModalTemplate()}
            
            <!-- Update Modal -->
            ${this.getUpdateModalTemplate()}
        `;
    },

    /**
     * Generate add application modal template
     * @returns {string} HTML for add application modal
     */
    getAddApplicationModalTemplate() {
        return `
            <div id="add-app-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Adicionar Nova Aplicação</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="add-app-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="app-name">Nome da Aplicação</label>
                                    <input type="text" id="app-name" placeholder="Ex: Portainer, Grafana, etc." required>
                                </div>
                                <div class="form-group">
                                    <label for="app-subdomain">Subdomínio</label>
                                    <input type="text" id="app-subdomain" placeholder="Ex: portainer, grafana, etc." required>
                                    <small class="form-help">Será usado para gerar a URL: https://[subdomain].{subdomain}.techify.free</small>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="app-username">Nome de Usuário</label>
                                    <input type="text" id="app-username" placeholder="Ex: admin, user, etc." required>
                                </div>
                                <div class="form-group">
                                    <label for="app-password">Senha</label>
                                    <input type="text" id="app-password" placeholder="Senha de acesso" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" id="modal-cancel">Cancelar</button>
                        <button type="submit" class="btn-primary" id="modal-save">Adicionar Aplicação</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Generate edit application modal template
     * @returns {string} HTML for edit application modal
     */
    getEditApplicationModalTemplate() {
        return `
            <div id="edit-app-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Aplicação</h3>
                        <button class="modal-close" id="edit-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-app-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-app-name">Nome da Aplicação</label>
                                    <input type="text" id="edit-app-name" placeholder="Ex: Portainer, Grafana, etc." required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-app-subdomain">Subdomínio</label>
                                    <input type="text" id="edit-app-subdomain" placeholder="Ex: portainer, grafana, etc." required>
                                    <small class="form-help">Será usado para gerar a URL: https://[subdomain].{subdomain}.techify.free</small>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-app-username">Nome de Usuário</label>
                                    <input type="text" id="edit-app-username" placeholder="Ex: admin, user, etc." required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-app-password">Senha</label>
                                    <input type="text" id="edit-app-password" placeholder="Senha de acesso" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" id="edit-modal-cancel">Cancelar</button>
                        <button type="submit" class="btn-primary" id="edit-modal-save">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Generate services table rows
     * @param {Array} applications - Array of applications from config
     * @returns {string} HTML for table rows
     */
    getServicesTableRows(applications = []) {
        // If no applications provided, show a message
        if (!applications || applications.length === 0) {
            return `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                        Nenhuma aplicação configurada
                    </td>
                </tr>
            `;
        }

        return applications.map((service, index) => `
            <tr data-app-index="${index}">
                <td>
                    <span class="service-name ${service.className}">${service.name}</span>
                </td>
                <td>
                    <div class="service-url">
                        <a href="${service.url}" target="_blank" class="url-link">${service.url}</a>
                        <button class="copy-btn" data-copy-text="${service.url}" title="Copiar URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="service-username">
                        <span class="username-text">${service.username}</span>
                        <button class="copy-btn" data-copy-text="${service.username}" title="Copiar usuário">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="service-password">
                        <span class="password-text password-hidden">••••••••••</span>
                        <span class="password-real" style="display: none;">${service.password}</span>
                        <button class="copy-btn" data-copy-text="${service.password}" title="Copiar senha">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-app-index="${index}" title="Editar aplicação">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="remove-btn" data-app-index="${index}" title="Remover aplicação">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Waiting state template
     * @returns {string} HTML template for waiting state
     */
    getWaitingTemplate() {
        return `
            <div class="waiting-container">
                <div class="waiting-content">
                    <div class="waiting-icon">⏳</div>
                    <div class="waiting-text">Aguardando</div>
                </div>
            </div>
        `;
    },

    /**
     * Status content template
     * @param {Object} externalTest - External test results
     * @returns {string} HTML template
     */
    getStatusTemplate(externalTest) {
        const statusBadge = externalTest.status === 'ok' ? 
            window.CONFIG.CSS_CLASSES.BADGE_OK : 
            window.CONFIG.CSS_CLASSES.BADGE_FAIL;
        
        let statusContent = `<span class="status-badge ${statusBadge}">
            Status: ${externalTest.status.toUpperCase()}
        </span>`;
        
        if (externalTest.statusCode) {
            statusContent += `<br><small>Código HTTP: ${externalTest.statusCode}</small>`;
        }
        if (externalTest.location) {
            statusContent += `<br><small>Redirecionamento para: ${externalTest.location}</small>`;
        }
        if (externalTest.error) {
            statusContent += `<br><small>Erro: ${externalTest.error}</small>`;
        }
        
        return statusContent;
    },

    /**
     * URL template
     * @param {string} url - URL to display
     * @returns {string} HTML template
     */
    getUrlTemplate(url) {
        return `<a href="${url}" target="_blank" class="url-link">${url}</a><br>`;
    },

    /**
     * Loading template
     * @param {string} message - Loading message
     * @returns {string} HTML template
     */
    getLoadingTemplate(message = 'Carregando...') {
        return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Error template
     * @param {string} message - Error message
     * @returns {string} HTML template
     */
    getErrorTemplate(message) {
        return `
            <div class="error-container">
                <h3>Erro</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="${window.CONFIG.CSS_CLASSES.BTN_PRIMARY}">
                    Tentar Novamente
                </button>
            </div>
        `;
    },

    /**
     * Generate update modal template
     * @returns {string} HTML for update modal
     */
    getUpdateModalTemplate() {
        return `
            <div id="update-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🚀 Atualização Disponível</h3>
                        <button id="update-modal-close" class="modal-close" type="button">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="update-info">
                            <div class="update-version-info">
                                <div class="version-comparison">
                                    <div class="current-version">
                                        <span class="version-label">Versão atual:</span>
                                        <span id="current-version-text" class="version-number">v1.0.0</span>
                                    </div>
                                    <div class="version-arrow">→</div>
                                    <div class="new-version">
                                        <span class="version-label">Nova versão:</span>
                                        <span id="new-version-text" class="version-number">v1.0.1</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="update-details">
                                <h4>📝 Novidades desta versão:</h4>
                                <div id="update-changelog" class="changelog">
                                    Carregando informações da atualização...
                                </div>
                                
                                <div id="update-requirements" class="requirements-info" style="display: none;">
                                    <h4>⚙️ Verificando requisitos do sistema...</h4>
                                    <div id="requirements-list" class="requirements-list">
                                        <!-- Requirements will be populated by JS -->
                                    </div>
                                </div>
                                
                                <div class="update-warning">
                                    <p><strong>⚠️ Atenção:</strong></p>
                                    <ul>
                                        <li>A atualização reiniciará os serviços automaticamente</li>
                                        <li>Um backup será criado antes da atualização</li>
                                        <li>O processo pode demorar alguns minutos</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div id="update-progress" style="display: none;">
                            <h4>🔄 Atualizando para <span id="updating-version">v1.0.1</span></h4>
                            <div class="progress-steps">
                                <div class="progress-step" id="step-checking">
                                    <div class="step-icon">⏳</div>
                                    <div class="step-text">Verificando atualizações</div>
                                </div>
                                <div class="progress-step" id="step-backup">
                                    <div class="step-icon">⏳</div>
                                    <div class="step-text">Criando backup</div>
                                </div>
                                <div class="progress-step" id="step-download">
                                    <div class="step-icon">⏳</div>
                                    <div class="step-text">Baixando arquivos</div>
                                </div>
                                <div class="progress-step" id="step-install">
                                    <div class="step-icon">⏳</div>
                                    <div class="step-text">Aplicando alterações</div>
                                </div>
                                <div class="progress-step" id="step-restart">
                                    <div class="step-icon">⏳</div>
                                    <div class="step-text">Reiniciando serviços</div>
                                </div>
                            </div>
                            
                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                                </div>
                                <div id="progress-text" class="progress-text">0%</div>
                            </div>
                            
                            <div class="progress-message">
                                <p id="current-step-message">Iniciando atualização...</p>
                            </div>
                            
                            <div class="update-warning">
                                <p><strong>⚠️ Não feche esta janela durante a atualização</strong></p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div id="update-actions">
                            <button id="update-cancel" class="btn-cancel" type="button">Cancelar</button>
                            <button id="update-start" class="btn-primary" type="button">
                                <span class="btn-icon">🔄</span>
                                Atualizar Agora
                            </button>
                        </div>
                        <div id="update-progress-actions" style="display: none;">
                            <button id="update-close-after" class="btn-cancel" type="button" disabled>Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Export to global scope
window.HtmlTemplates = HtmlTemplates;
