/**
 * Techify Free Tools - Main Application (Refactored)
 * Modular frontend application with improved architecture
 */

const App = {
    // Application state
    state: {
        isInitialized: false,
        updateInterval: null,
        elements: {}
    },

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Inicializando Techify Free Tools...');
            
            // Initialize DOM elements
            this.initElements();
            
            // Initialize authentication service
            await window.AuthService.init();
            
            // Show appropriate UI based on auth status
            if (window.AuthService.isAuthenticated()) {
                this.showMainUI();
                this.startStatusUpdates();
            } else {
                this.showAuthUI();
            }
            
            // Load version information (always show, even on auth screen)
            this.loadVersionInfo();
            
            this.state.isInitialized = true;
            console.log('✅ Aplicação inicializada com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar aplicação:', error);
            this.showError('Erro ao inicializar aplicação');
        }
    },

    /**
     * Initialize DOM elements references
     */
    initElements() {
        this.state.elements = {
            container: window.DOMUtils.querySelector(window.CONFIG.SELECTORS.CONTAINER),
            subdomain: window.DOMUtils.querySelector(window.CONFIG.SELECTORS.SUBDOMAIN),
            urlContainer: window.DOMUtils.querySelector(window.CONFIG.SELECTORS.URL_CONTAINER),
            statusContainer: window.DOMUtils.querySelector(window.CONFIG.SELECTORS.STATUS_CONTAINER),
            timestamp: window.DOMUtils.querySelector(window.CONFIG.SELECTORS.TIMESTAMP),
            versionBadge: document.getElementById('app-version'),
            versionText: document.getElementById('version-text')
        };
    },

    /**
     * Show authentication UI
     */
    showAuthUI() {
        const container = this.state.elements.container;
        if (!container) return;

        const hasPassword = window.AuthService.hasPassword();
        const authHTML = window.HtmlTemplates.getAuthTemplate(hasPassword);
        
        window.DOMUtils.setContent(container, authHTML, true);
        this.bindAuthEvents();
    },

    /**
     * Show main application UI
     */
    async showMainUI() {
        const container = this.state.elements.container;
        if (!container) return;

        try {
            const hasPassword = window.AuthService.hasPassword();
            
            // Load applications from API
            const applicationsData = await window.ApiService.getApplications();
            const applications = applicationsData.applications || [];
            
            // Get subdomain data
            const subdomainData = await window.ApiService.getSubdomain();
            const subdomain = subdomainData.subdomain || '';
            
            const mainHTML = window.HtmlTemplates.getMainTemplate(hasPassword, applications, subdomain);
            
            window.DOMUtils.setContent(container, mainHTML, true);
            
            // Re-initialize element references after DOM update
            this.initElements();
            this.bindMainEvents();
            this.bindCopyEvents();
            this.bindToggleEvents();
            
            // Load basic info immediately
            this.loadBasicInfo();
            
            // Execute tests after loading basic info
            this.startStatusUpdates();
            
        } catch (error) {
            console.error('❌ Erro ao carregar aplicações:', error);
            // Fallback to empty applications
            const hasPassword = window.AuthService.hasPassword();
            
            // Try to get subdomain even in error case
            let subdomain = '';
            try {
                const subdomainData = await window.ApiService.getSubdomain();
                subdomain = subdomainData.subdomain || '';
            } catch (subdomainError) {
                console.error('❌ Erro ao carregar subdomain:', subdomainError);
            }
            
            const mainHTML = window.HtmlTemplates.getMainTemplate(hasPassword, [], subdomain);
            window.DOMUtils.setContent(container, mainHTML, true);
            
            this.initElements();
            this.bindMainEvents();
            this.bindCopyEvents();
            this.bindToggleEvents();
            this.loadBasicInfo();
            
            // Execute tests even in error case
            this.startStatusUpdates();
        }
    },

    /**
     * Bind authentication form events
     */
    bindAuthEvents() {
        // Set password button
        const setPasswordBtn = window.DOMUtils.getElementById('btn-set-password');
        if (setPasswordBtn) {
            window.DOMUtils.addEventListener(setPasswordBtn, 'click', () => this.handleSetPassword());
        }

        // Skip password button
        const skipPasswordBtn = window.DOMUtils.getElementById('btn-skip-password');
        if (skipPasswordBtn) {
            window.DOMUtils.addEventListener(skipPasswordBtn, 'click', () => this.handleSkipPassword());
        }

        // Login button
        const loginBtn = window.DOMUtils.getElementById('btn-login');
        if (loginBtn) {
            window.DOMUtils.addEventListener(loginBtn, 'click', () => this.handleLogin());
        }

        // Enter key on password inputs
        const newPasswordInput = window.DOMUtils.getElementById('new-password');
        if (newPasswordInput) {
            window.DOMUtils.addEventListener(newPasswordInput, 'keypress', (e) => {
                if (e.key === 'Enter') this.handleSetPassword();
            });
        }

        const loginPasswordInput = window.DOMUtils.getElementById('login-password');
        if (loginPasswordInput) {
            window.DOMUtils.addEventListener(loginPasswordInput, 'keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
    },

    /**
     * Bind main application events
     */
    bindMainEvents() {
        // Change password button
        const changePasswordBtn = window.DOMUtils.getElementById('btn-change-password');
        if (changePasswordBtn) {
            window.DOMUtils.addEventListener(changePasswordBtn, 'click', () => this.handleChangePassword());
        }

        // Configure password button  
        const configurePasswordBtn = window.DOMUtils.getElementById('btn-configure-password');
        if (configurePasswordBtn) {
            window.DOMUtils.addEventListener(configurePasswordBtn, 'click', () => this.handleSetPasswordMain());
        }

        // Remove password button
        const removePasswordBtn = window.DOMUtils.getElementById('btn-remove-password');
        if (removePasswordBtn) {
            window.DOMUtils.addEventListener(removePasswordBtn, 'click', () => this.handleRemovePassword());
        }

        // Logout button
        const logoutBtn = window.DOMUtils.getElementById('btn-logout');
        if (logoutBtn) {
            window.DOMUtils.addEventListener(logoutBtn, 'click', () => this.handleLogout());
        }

        // Bind edit modal events
        this.bindEditModalEvents();
        
        // Bind application management events
        this.bindApplicationManagementEvents();
        
        // Bind version badge events
        this.bindVersionEvents();
    },

    /**
     * Bind copy button events
     */
    bindCopyEvents() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCopy(btn);
            });
        });
    },

    /**
     * Handle copy functionality
     */
    async handleCopy(button) {
        let textToCopy = '';
        
        try {
            // Check if button has data-copy-text attribute (direct text)
            if (button.hasAttribute('data-copy-text')) {
                textToCopy = button.getAttribute('data-copy-text');
            } 
            // Check if button has data-copy attribute (element ID)
            else if (button.hasAttribute('data-copy')) {
                const elementId = button.getAttribute('data-copy');
                const element = document.getElementById(elementId);
                if (element) {
                    textToCopy = element.textContent.trim();
                }
            }

            if (!textToCopy) {
                console.warn('❌ Nenhum texto para copiar');
                return;
            }

            // Try modern clipboard API first (requires HTTPS)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    this.showCopySuccess(button, textToCopy);
                    return;
                } catch (clipboardError) {
                    console.warn('❌ Clipboard API falhou, usando fallback:', clipboardError);
                }
            }

            // Fallback for older browsers or HTTP
            this.copyTextFallback(textToCopy, button);
            
        } catch (error) {
            console.error('❌ Erro geral ao copiar:', error);
            this.copyTextFallback(textToCopy, button);
        }
    },

    /**
     * Fallback copy method for older browsers
     */
    copyTextFallback(text, button) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showCopySuccess(button, text);
            } else {
                console.error('❌ execCommand copy falhou');
                alert('Erro ao copiar texto. Tente selecionar e copiar manualmente.');
            }
        } catch (fallbackError) {
            console.error('❌ Erro no fallback:', fallbackError);
            alert('Erro ao copiar texto. Tente selecionar e copiar manualmente.');
        }
    },

    /**
     * Show copy success feedback
     */
    showCopySuccess(button, text) {
        // Visual feedback
        button.classList.add('copied');
        const originalTitle = button.title;
        button.title = 'Copiado!';
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.title = originalTitle;
        }, 1000);
        
        console.log('✅ Texto copiado:', text);
    },

    /**
     * Bind toggle events
     */
    bindToggleEvents() {
        const toggleBtn = document.getElementById('toggle-passwords');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
    },

    /**
     * Toggle password visibility in table
     */
    togglePasswordVisibility() {
        const passwordHidden = document.querySelectorAll('.password-hidden');
        const passwordReal = document.querySelectorAll('.password-real');
        const toggleBtn = document.getElementById('toggle-passwords');
        
        const isHidden = passwordHidden[0]?.style.display !== 'none';
        
        passwordHidden.forEach(el => {
            el.style.display = isHidden ? 'none' : 'inline';
        });
        
        passwordReal.forEach(el => {
            el.style.display = isHidden ? 'inline' : 'none';
        });
        
        if (toggleBtn) {
            toggleBtn.innerHTML = isHidden ? `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                Ocultar Senhas
            ` : `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Mostrar Senhas
            `;
        }
    },

    /**
     * Handle set password
     */
    async handleSetPassword() {
        const passwordInput = window.DOMUtils.getElementById('new-password');
        const password = window.DOMUtils.getValue(passwordInput);
        
        const validation = window.AuthService.validatePassword(password);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        try {
            const result = await window.AuthService.setPassword(password);
            
            if (result.success) {
                this.showSuccess('Senha definida com sucesso! Faça login agora.');
                await window.AuthService.checkAuthStatus();
                this.showAuthUI();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Erro ao definir senha');
        }
    },

    /**
     * Handle skip password
     */
    handleSkipPassword() {
        window.AuthService.state.isAuthenticated = true;
        this.showMainUI();
        this.startStatusUpdates();
    },

    /**
     * Handle login
     */
    async handleLogin() {
        const passwordInput = window.DOMUtils.getElementById('login-password');
        const errorDiv = window.DOMUtils.getElementById('login-error');
        const password = window.DOMUtils.getValue(passwordInput);
        
        if (!password) {
            window.DOMUtils.setContent(errorDiv, 'Digite a senha');
            return;
        }

        try {
            window.DOMUtils.setContent(errorDiv, '');
            const result = await window.AuthService.login(password);
            
            if (result.success) {
                this.showMainUI();
                this.startStatusUpdates();
            } else {
                window.DOMUtils.setContent(errorDiv, result.error);
            }
        } catch (error) {
            window.DOMUtils.setContent(errorDiv, 'Erro ao fazer login');
        }
    },

    /**
     * Handle change password
     */
    async handleChangePassword() {
        const newPassword = prompt('Digite a nova senha (min. 4 caracteres):');
        if (!newPassword) return;

        const validation = window.AuthService.validatePassword(newPassword);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        try {
            const result = await window.AuthService.setPassword(newPassword);
            
            if (result.success) {
                alert('Senha alterada com sucesso! Faça login novamente.');
                this.showAuthUI();
                this.stopStatusUpdates();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            alert('Erro ao alterar senha');
        }
    },

    /**
     * Handle remove password
     */
    async handleRemovePassword() {
        if (!confirm('Tem certeza que deseja remover a proteção por senha?')) {
            return;
        }

        try {
            const result = await window.AuthService.removePassword();
            
            if (result.success) {
                this.showSuccess('Senha removida com sucesso!');
                this.showMainUI();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Erro ao remover senha');
        }
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await window.AuthService.logout();
            this.stopStatusUpdates();
            this.showAuthUI();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    /**
     * Handle set password from main UI
     */
    async handleSetPasswordMain() {
        const newPassword = prompt('Digite uma senha para proteger a aplicação (min. 4 caracteres):');
        if (!newPassword) return;

        const validation = window.AuthService.validatePassword(newPassword);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        try {
            const result = await window.AuthService.setPassword(newPassword);
            
            if (result.success) {
                alert('Senha definida com sucesso!');
                this.showMainUI();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            alert('Erro ao definir senha');
        }
    },

    /**
     * Start status updates (removed automatic updates - only on page load)
     */
    startStatusUpdates() {
        // Clear any existing interval
        this.stopStatusUpdates();
        
        // Initial load only (no automatic updates)
        this.updateStatus();
        
        console.log('📍 Testes executados - sem atualizações automáticas');
    },

    /**
     * Load basic information immediately (subdomain)
     */
    async loadBasicInfo() {
        try {
            console.log('📍 Carregando informações básicas...');
            const data = await window.ApiService.getSubdomain();
            
            // Update subdomain immediately
            const subdomainEl = this.state.elements.subdomain;
            if (subdomainEl && data.subdomain) {
                console.log('✍️ Atualizando subdomain imediatamente:', data.subdomain);
                window.DOMUtils.setContent(subdomainEl, data.subdomain);
                this.state.currentSubdomain = data.subdomain;
            }
            
            // Update external URL
            const externalUrl = document.getElementById('external-url');
            
            if (externalUrl && data.subdomain) {
                const testingUrl = `https://coolify.${data.subdomain}.techify.free/login`;
                externalUrl.textContent = testingUrl;
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar informações básicas:', error);
        }
    },

    /**
     * Stop status updates
     */
    stopStatusUpdates() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
            this.state.updateInterval = null;
        }
    },

    /**
     * Update status data
     */
    async updateStatus() {
        console.log('🔄 Atualizando status...');
        console.log('Autenticado?', window.AuthService.isAuthenticated());
        
        if (!window.AuthService.isAuthenticated()) {
            console.log('❌ Não autenticado, pulando atualização');
            return;
        }

        try {
            console.log('📡 Fazendo requisição para /api/status');
            const data = await window.ApiService.getStatus();
            console.log('✅ Dados recebidos:', JSON.stringify(data, null, 2));
            this.updateUI(data);
        } catch (error) {
            console.error('❌ Status update error:', error);
            
            if (error.message.includes('401')) {
                console.log('🔒 Sessão expirada');
                window.AuthService.handleSessionExpired();
                return;
            }
            
            this.handleStatusError(error);
        }
    },

    /**
     * Update UI with status data
     * @param {Object} data - Status data
     */
    updateUI(data) {
        console.log('🎨 Atualizando UI com dados:', data);
        
        // Store current subdomain in state
        if (data.subdomain && data.subdomain !== this.state.currentSubdomain) {
            console.log('🔄 Subdomínio mudou para:', data.subdomain);
            this.state.currentSubdomain = data.subdomain;
        }

        // Update individual tests if tests data is available
        if (data.tests) {
            this.updateTestResults(data.tests);
        }

        // Update timestamp
        const timestampEl = this.state.elements.timestamp;
        console.log('⏰ Elemento timestamp:', timestampEl);
        if (timestampEl) {
            console.log('✍️ Atualizando timestamp para:', data.timestamp);
            window.DOMUtils.setContent(timestampEl, `Última verificação: ${data.timestamp}`);
        }
    },

    /**
     * Update individual test results in the UI
     * @param {Object} tests - Test results object
     */
    updateTestResults(tests) {
        console.log('🧪 Atualizando resultados dos testes:', tests);
        
        // Update Internet test
        if (tests.internet) {
            this.updateTestElement('test-internet', tests.internet);
        }
        
        // Update Techify Server test
        if (tests.techifyServer) {
            this.updateTestElement('test-techify-server', tests.techifyServer);
        }
        
        // Update Subdomain test
        if (tests.subdomain) {
            this.updateTestElement('test-subdomain', tests.subdomain);
        }
        
        // Update Tunnel test
        if (tests.tunnel) {
            this.updateTestElement('test-tunnel', tests.tunnel);
        }
        
        // Update External Access test
        if (tests.externalAccess) {
            this.updateTestElement('test-external', tests.externalAccess);
        }
    },

    /**
     * Update individual test element
     * @param {string} elementId - Element ID to update
     * @param {Object} testResult - Test result object
     */
    updateTestElement(elementId, testResult) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const { status, details } = testResult;
        
        // Determine badge class based on status
        let badgeClass = 'status-loading';
        let statusIcon = '🔄';
        
        switch (status) {
            case 'Ok':
            case 'OK':
                badgeClass = 'status-ok';
                statusIcon = '✅';
                break;
            case 'Fail':
                badgeClass = 'status-fail';
                statusIcon = '❌';
                break;
            case 'Aguardando':
                badgeClass = 'status-waiting';
                statusIcon = '⏳';
                break;
            default:
                badgeClass = 'status-loading';
                statusIcon = '🔄';
        }
        
        // Update element content
        element.className = `status-badge ${badgeClass}`;
        element.innerHTML = `${statusIcon} ${status}`;
        
        // Add title with details for hover
        if (details) {
            element.title = details;
        }
        
        console.log(`✅ Teste ${elementId}: ${status} - ${details}`);
    },

    /**
     * Show loading state
     */
    showLoading() {
        const container = this.state.elements.container;
        if (container) {
            window.DOMUtils.addClass(container, window.CONFIG.CSS_CLASSES.LOADING);
        }
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        const container = this.state.elements.container;
        if (container) {
            window.DOMUtils.removeClass(container, window.CONFIG.CSS_CLASSES.LOADING);
        }
    },

    /**
     * Handle status update errors
     * @param {Error} error - The error
     */
    handleStatusError(error) {
        const timestampEl = this.state.elements.timestamp;
        if (timestampEl) {
            const timestamp = new Date().toLocaleString('pt-BR');
            window.DOMUtils.setContent(timestampEl, `Erro ao carregar dados: ${timestamp}`);
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error('App Error:', message);
        // Could be enhanced with toast notifications
        alert(`Erro: ${message}`);
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        console.log('App Success:', message);
        // Could be enhanced with toast notifications
        alert(message);
    },

    /**
     * Bind edit modal events
     */
    bindEditModalEvents() {
        console.log('🔧 Configurando eventos de edição via modal...');
        
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            // Add click event listeners to edit buttons
            const editButtons = document.querySelectorAll('.edit-btn');
            console.log(`✏️ Encontrados ${editButtons.length} botões de edição`);
            
            editButtons.forEach((button, index) => {
                const appIndex = button.dataset.appIndex;
                console.log(`✏️ Configurando botão de edição ${index} para aplicação: ${appIndex}`);
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖊️ Clique de edição detectado para aplicação:', appIndex);
                    this.handleEditApplication(parseInt(appIndex));
                });
            });
        }, 100);
    },

    /**
     * Handle edit application - opens modal with current data
     * @param {number} appIndex - Application index to edit
     */
    async handleEditApplication(appIndex) {
        if (isNaN(appIndex)) {
            this.showError('Índice de aplicação inválido');
            return;
        }

        try {
            console.log(`🎯 Abrindo modal para editar aplicação ${appIndex}...`);
            
            // Get current applications to fetch the data
            const applicationsData = await window.ApiService.getApplications();
            const applications = applicationsData.applications || [];
            
            if (appIndex >= applications.length) {
                this.showError('Aplicação não encontrada');
                return;
            }
            
            const application = applications[appIndex];
            this.showEditApplicationModal(application, appIndex);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados da aplicação:', error);
            this.showError('Erro ao carregar dados da aplicação');
        }
    },

    /**
     * Show edit application modal
     * @param {Object} application - Application data
     * @param {number} appIndex - Application index
     */
    showEditApplicationModal(application, appIndex) {
        const modal = document.getElementById('edit-app-modal');
        if (!modal) return;

        // Store the app index for later use
        modal.dataset.appIndex = appIndex;
        
        modal.style.display = 'flex';
        
        // Extract subdomain from URL (https://subdomain.franc.techify.free -> subdomain)
        const urlParts = application.url.split('://')[1].split('.');
        const subdomain = urlParts[0];
        
        // Fill form fields with current data
        document.getElementById('edit-app-name').value = application.name;
        document.getElementById('edit-app-subdomain').value = subdomain;
        document.getElementById('edit-app-username').value = application.username;
        document.getElementById('edit-app-password').value = application.password;
        
        // Focus first field
        document.getElementById('edit-app-name').focus();
        
        // Bind modal events
        this.bindEditModalFormEvents();
    },

    /**
     * Hide edit application modal
     */
    hideEditApplicationModal() {
        const modal = document.getElementById('edit-app-modal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.appIndex;
        }
    },

    /**
     * Bind edit modal form events
     */
    bindEditModalFormEvents() {
        const modal = document.getElementById('edit-app-modal');
        const closeBtn = document.getElementById('edit-modal-close');
        const cancelBtn = document.getElementById('edit-modal-cancel');
        const saveBtn = document.getElementById('edit-modal-save');
        const form = document.getElementById('edit-app-form');

        // Remove existing event listeners to prevent duplicates
        const newCloseBtn = closeBtn?.cloneNode(true);
        const newCancelBtn = cancelBtn?.cloneNode(true);
        const newSaveBtn = saveBtn?.cloneNode(true);
        const newForm = form?.cloneNode(true);

        if (closeBtn && newCloseBtn) {
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => this.hideEditApplicationModal());
        }

        if (cancelBtn && newCancelBtn) {
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', () => this.hideEditApplicationModal());
        }

        if (saveBtn && newSaveBtn) {
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.handleEditModalSave());
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideEditApplicationModal();
                }
            });
        }

        // Handle form submission
        if (form && newForm) {
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditModalSave();
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                this.hideEditApplicationModal();
            }
        });
    },

    /**
     * Handle edit modal save
     */
    async handleEditModalSave() {
        const modal = document.getElementById('edit-app-modal');
        const appIndex = parseInt(modal.dataset.appIndex);
        
        if (isNaN(appIndex)) {
            this.showError('Erro: índice da aplicação inválido');
            return;
        }

        const name = document.getElementById('edit-app-name').value.trim();
        const subdomain = document.getElementById('edit-app-subdomain').value.trim();
        const username = document.getElementById('edit-app-username').value.trim();
        const password = document.getElementById('edit-app-password').value.trim();

        // Validation
        if (!name) {
            this.showError('Nome da aplicação é obrigatório');
            return;
        }

        if (!subdomain) {
            this.showError('Subdomínio é obrigatório');
            return;
        }

        if (!username) {
            this.showError('Nome de usuário é obrigatório');
            return;
        }

        if (!password) {
            this.showError('Senha é obrigatória');
            return;
        }

        try {
            console.log(`💾 Salvando alterações da aplicação ${appIndex}...`);
            
            // Generate updated application data with placeholder pattern
            const updateData = {
                name: name,
                url: `https://${subdomain}.{subdomain}.techify.free`,
                username: username,
                password: password
            };

            console.log('📦 Dados atualizados:', updateData);

            const result = await this.updateApplication(appIndex, updateData);
            
            if (result.success) {
                this.showSuccess('Aplicação atualizada com sucesso!');
                this.hideEditApplicationModal();
                // Reload the main UI to show the updated application
                this.showMainUI();
            } else {
                this.showError(result.error || 'Erro ao atualizar aplicação');
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar aplicação:', error);
            this.showError(`Erro ao atualizar aplicação: ${error.message}`);
        }
    },

    /**
     * Update application via API
     * @param {number} index - Application index
     * @param {Object} updateData - Data to update
     * @returns {Object} Result object
     */
    async updateApplication(index, updateData) {
        try {
            console.log(`📡 Atualizando aplicação ${index}:`, updateData);
            
            const response = await window.ApiService.put(`/api/status/applications/${index}`, updateData);
            
            return {
                success: true,
                data: response
            };
            
        } catch (error) {
            console.error('❌ Erro na API de atualização:', error);
            return {
                success: false,
                error: error.message || 'Erro de comunicação com o servidor'
            };
        }
    },

    /**
     * Bind application management events (add/remove)
     */
    bindApplicationManagementEvents() {
        // Add application button
        const addAppBtn = document.getElementById('add-application');
        if (addAppBtn) {
            addAppBtn.addEventListener('click', () => this.handleAddApplication());
        }

        // Remove application buttons
        const removeButtons = document.querySelectorAll('.remove-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const appIndex = parseInt(btn.dataset.appIndex);
                this.handleRemoveApplication(appIndex);
            });
        });
    },

    /**
     * Handle add new application - opens modal
     */
    handleAddApplication() {
        console.log('🎯 Abrindo modal para adicionar aplicação...');
        this.showAddApplicationModal();
    },

    /**
     * Show add application modal
     */
    showAddApplicationModal() {
        const modal = document.getElementById('add-app-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Clear form fields
            document.getElementById('app-name').value = '';
            document.getElementById('app-subdomain').value = '';
            document.getElementById('app-username').value = '';
            document.getElementById('app-password').value = '';
            
            // Focus first field
            document.getElementById('app-name').focus();
            
            // Bind modal events
            this.bindModalEvents();
        }
    },

    /**
     * Hide add application modal
     */
    hideAddApplicationModal() {
        const modal = document.getElementById('add-app-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Bind modal events
     */
    bindModalEvents() {
        const modal = document.getElementById('add-app-modal');
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('modal-cancel');
        const saveBtn = document.getElementById('modal-save');
        const form = document.getElementById('add-app-form');

        // Remove existing event listeners to prevent duplicates
        const newCloseBtn = closeBtn?.cloneNode(true);
        const newCancelBtn = cancelBtn?.cloneNode(true);
        const newSaveBtn = saveBtn?.cloneNode(true);
        const newForm = form?.cloneNode(true);

        if (closeBtn && newCloseBtn) {
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => this.hideAddApplicationModal());
        }

        if (cancelBtn && newCancelBtn) {
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', () => this.hideAddApplicationModal());
        }

        if (saveBtn && newSaveBtn) {
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.handleModalSave());
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAddApplicationModal();
                }
            });
        }

        // Handle form submission
        if (form && newForm) {
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleModalSave();
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                this.hideAddApplicationModal();
            }
        });
    },

    /**
     * Handle modal save
     */
    async handleModalSave() {
        const name = document.getElementById('app-name').value.trim();
        const subdomain = document.getElementById('app-subdomain').value.trim();
        const username = document.getElementById('app-username').value.trim();
        const password = document.getElementById('app-password').value.trim();

        // Validation
        if (!name) {
            this.showError('Nome da aplicação é obrigatório');
            return;
        }

        if (!subdomain) {
            this.showError('Subdomínio é obrigatório');
            return;
        }

        if (!username) {
            this.showError('Nome de usuário é obrigatório');
            return;
        }

        if (!password) {
            this.showError('Senha é obrigatória');
            return;
        }

        try {
            console.log('➕ Adicionando nova aplicação via modal...');
            
            // Get current subdomain to generate URL
            const currentSubdomain = this.state.currentSubdomain || 'franc';
            
            // Generate application data with round robin class name
            const applicationData = {
                name: name,
                className: this.getNextClassName(),
                subdomain: subdomain,
                username: username,
                password: password
            };

            console.log('📦 Dados da aplicação:', applicationData);

            const result = await window.ApiService.addApplication(applicationData);
            
            if (result.message) {
                this.showSuccess('Aplicação adicionada com sucesso!');
                this.hideAddApplicationModal();
                // Reload the main UI to show the new application
                this.showMainUI();
            } else {
                this.showError('Erro ao adicionar aplicação');
            }

        } catch (error) {
            console.error('❌ Erro ao adicionar aplicação:', error);
            this.showError(`Erro ao adicionar aplicação: ${error.message}`);
        }
    },

    /**
     * Get next class name using round robin system
     * @returns {string} Next class name
     */
    getNextClassName() {
        const classNames = ['coolify', 'portainer', 'n8n', 'grafana', 'uptime'];
        
        // Use a simple counter stored in localStorage
        let counter = parseInt(localStorage.getItem('app-class-counter') || '0');
        const className = classNames[counter % classNames.length];
        
        // Increment and store counter
        counter++;
        localStorage.setItem('app-class-counter', counter.toString());
        
        console.log(`🎨 Classe CSS selecionada: ${className} (contador: ${counter})`);
        
        return className;
    },

    /**
     * Handle remove application
     * @param {number} appIndex - Application index to remove
     */
    async handleRemoveApplication(appIndex) {
        if (isNaN(appIndex)) {
            this.showError('Índice de aplicação inválido');
            return;
        }

        if (!confirm('Tem certeza que deseja remover esta aplicação?')) {
            return;
        }

        try {
            console.log(`🗑️ Removendo aplicação ${appIndex}...`);
            
            const result = await window.ApiService.removeApplication(appIndex);
            
            if (result.message) {
                this.showSuccess('Aplicação removida com sucesso!');
                // Reload the main UI to remove the application from the table
                this.showMainUI();
            } else {
                this.showError('Erro ao remover aplicação');
            }

        } catch (error) {
            console.error('❌ Erro ao remover aplicação:', error);
            this.showError(`Erro ao remover aplicação: ${error.message}`);
        }
    },

    /**
     * Load and display version information
     */
    async loadVersionInfo() {
        try {
            console.log('🏷️ Carregando informações de versão...');
            
            const versionData = await window.ApiService.getVersion();
            
            if (versionData && versionData.version) {
                this.updateVersionDisplay(versionData.version);
                console.log(`✅ Versão carregada: ${versionData.version}`);
                
                // Check for updates if authenticated
                if (window.AuthService.isAuthenticated()) {
                    this.checkForUpdates();
                }
            } else {
                this.updateVersionDisplay('1.0.0'); // fallback
                console.warn('⚠️ Versão não encontrada nos dados, usando fallback');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar versão:', error);
            this.updateVersionDisplay('1.0.0'); // fallback on error
        }
    },

    /**
     * Check for available updates
     */
    async checkForUpdates() {
        try {
            console.log('🔍 Verificando atualizações disponíveis...');
            
            const updateCheck = await window.ApiService.checkForUpdates();
            
            if (updateCheck.success && updateCheck.data) {
                const { hasUpdate, latestVersion, currentVersion, updateInfo } = updateCheck.data;
                
                if (hasUpdate) {
                    console.log(`🔄 Atualização disponível: ${currentVersion} → ${latestVersion}`);
                    this.updateVersionDisplay(currentVersion, true);
                    this.state.updateAvailable = updateInfo;
                } else {
                    console.log(`✅ Aplicação atualizada (${currentVersion})`);
                    this.updateVersionDisplay(currentVersion, false);
                    this.state.updateAvailable = null;
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Erro ao verificar atualizações:', error);
            // Don't show error to user, just log it
        }
    },

    /**
     * Update version display in the UI
     * @param {string} version - Version string
     * @param {boolean} hasUpdate - Whether an update is available
     */
    updateVersionDisplay(version, hasUpdate = false) {
        const versionText = this.state.elements.versionText;
        const versionBadge = this.state.elements.versionBadge;
        
        if (versionText) {
            versionText.textContent = `v${version}`;
        }
        
        if (versionBadge) {
            if (hasUpdate) {
                versionBadge.classList.add('update-available');
                versionBadge.title = 'Clique para atualizar para a nova versão';
                // Change icon to update icon
                const versionIcon = versionBadge.querySelector('.version-icon');
                if (versionIcon) {
                    versionIcon.textContent = '🔄';
                }
            } else {
                versionBadge.classList.remove('update-available');
                versionBadge.title = `Versão atual: v${version}`;
                // Reset icon
                const versionIcon = versionBadge.querySelector('.version-icon');
                if (versionIcon) {
                    versionIcon.textContent = '🏷️';
                }
            }
        }
        
        // Store current version in state
        this.state.currentVersion = version;
    },

    /**
     * Bind version badge events
     */
    bindVersionEvents() {
        const versionBadge = this.state.elements.versionBadge;
        if (versionBadge) {
            versionBadge.addEventListener('click', () => {
                if (this.state.updateAvailable) {
                    this.showUpdateModal();
                }
            });
        }
    },

    /**
     * Show update modal with full functionality
     */
    async showUpdateModal() {
        if (!this.state.updateAvailable) return;
        
        const updateInfo = this.state.updateAvailable;
        const modal = document.getElementById('update-modal');
        
        if (!modal) {
            console.error('❌ Modal de atualização não encontrado');
            return;
        }
        
        console.log('🔄 Abrindo modal de atualização:', updateInfo);
        
        // Populate version information
        this.populateUpdateInfo(updateInfo);
        
        // Show the modal
        modal.style.display = 'flex';
        
        // Bind modal events
        this.bindUpdateModalEvents();
        
        // Check system requirements
        await this.checkUpdateRequirements();
    },

    /**
     * Hide update modal
     */
    hideUpdateModal() {
        const modal = document.getElementById('update-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetUpdateModal();
        }
    },

    /**
     * Populate update information in modal
     */
    populateUpdateInfo(updateInfo) {
        const currentVersionText = document.getElementById('current-version-text');
        const newVersionText = document.getElementById('new-version-text');
        const updateChangelog = document.getElementById('update-changelog');
        const updatingVersion = document.getElementById('updating-version');
        
        if (currentVersionText) {
            currentVersionText.textContent = `v${this.state.currentVersion}`;
        }
        
        if (newVersionText) {
            newVersionText.textContent = `v${updateInfo.version}`;
        }
        
        if (updatingVersion) {
            updatingVersion.textContent = `v${updateInfo.version}`;
        }
        
        if (updateChangelog) {
            // Format changelog from GitHub release description
            const changelog = updateInfo.description || 'Informações de atualização não disponíveis.';
            updateChangelog.innerHTML = this.formatChangelog(changelog);
        }
    },

    /**
     * Format changelog for display
     */
    formatChangelog(changelog) {
        // Simple markdown-like formatting
        let formatted = changelog
            .replace(/^### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^## (.*$)/gim, '<h4>$1</h4>')
            .replace(/^# (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>');
        
        // Wrap consecutive list items in ul tags
        formatted = formatted.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        
        // Replace newlines with paragraphs
        formatted = formatted.replace(/\n\n/g, '</p><p>').replace(/^(.+)$/gm, '<p>$1</p>');
        
        // Clean up empty paragraphs and normalize
        formatted = formatted
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[345]>)/g, '$1')
            .replace(/(<\/h[345]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>)/g, '$1')
            .replace(/(<\/ul>)<\/p>/g, '$1');
        
        return formatted;
    },

    /**
     * Check update requirements
     */
    async checkUpdateRequirements() {
        try {
            const requirementsContainer = document.getElementById('update-requirements');
            const requirementsList = document.getElementById('requirements-list');
            
            if (!requirementsContainer || !requirementsList) return;
            
            requirementsContainer.style.display = 'block';
            requirementsList.innerHTML = '<div class="requirement-item"><div class="requirement-icon">⏳</div><div class="requirement-text">Verificando requisitos...</div></div>';
            
            const requirements = await window.ApiService.getUpdateRequirements();
            
            if (requirements.success && requirements.data) {
                const data = requirements.data;
                this.displayRequirements(data, requirementsList);
                
                // Enable/disable update button based on requirements
                const updateButton = document.getElementById('update-start');
                if (updateButton) {
                    updateButton.disabled = !data.canUpdate;
                    if (!data.canUpdate) {
                        updateButton.textContent = 'Requisitos não atendidos';
                        updateButton.style.background = '#6b7280';
                    }
                }
            } else {
                requirementsList.innerHTML = '<div class="requirement-item requirement-error"><div class="requirement-icon">❌</div><div class="requirement-text">Erro ao verificar requisitos</div></div>';
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar requisitos:', error);
            const requirementsList = document.getElementById('requirements-list');
            if (requirementsList) {
                requirementsList.innerHTML = '<div class="requirement-item requirement-error"><div class="requirement-icon">❌</div><div class="requirement-text">Erro ao verificar requisitos do sistema</div></div>';
            }
        }
    },

    /**
     * Display requirements in the modal
     */
    displayRequirements(requirements, container) {
        const items = [
            { key: 'hasGit', text: 'Git instalado', required: true },
            { key: 'hasInternet', text: 'Conexão com internet', required: true },
            { key: 'hasSpace', text: 'Espaço em disco suficiente', required: true },
            { key: 'hasPermissions', text: 'Permissões de escrita', required: true }
        ];
        
        let html = '';
        
        items.forEach(item => {
            const status = requirements[item.key];
            const iconClass = status ? 'requirement-ok' : 'requirement-error';
            const icon = status ? '✅' : '❌';
            
            html += `
                <div class="requirement-item ${iconClass}">
                    <div class="requirement-icon">${icon}</div>
                    <div class="requirement-text">${item.text}</div>
                </div>
            `;
        });
        
        // Show errors if any
        if (requirements.errors && requirements.errors.length > 0) {
            html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #fbbf24;">';
            requirements.errors.forEach(error => {
                html += `
                    <div class="requirement-item requirement-error">
                        <div class="requirement-icon">⚠️</div>
                        <div class="requirement-text">${error}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        container.innerHTML = html;
    },

    /**
     * Bind update modal events
     */
    bindUpdateModalEvents() {
        const modal = document.getElementById('update-modal');
        const closeBtn = document.getElementById('update-modal-close');
        const cancelBtn = document.getElementById('update-cancel');
        const startBtn = document.getElementById('update-start');
        const closeAfterBtn = document.getElementById('update-close-after');
        
        // Remove existing listeners by cloning elements
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => this.hideUpdateModal());
        }
        
        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', () => this.hideUpdateModal());
        }
        
        if (startBtn) {
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            newStartBtn.addEventListener('click', () => this.handleUpdateStart());
        }
        
        if (closeAfterBtn) {
            const newCloseAfterBtn = closeAfterBtn.cloneNode(true);
            closeAfterBtn.parentNode.replaceChild(newCloseAfterBtn, closeAfterBtn);
            newCloseAfterBtn.addEventListener('click', () => this.hideUpdateModal());
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideUpdateModal();
                }
            });
        }
        
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                this.hideUpdateModal();
            }
        });
    },

    /**
     * Handle update start - real implementation
     */
    async handleUpdateStart() {
        console.log('🚀 Iniciando atualização...');
        
        try {
            // Switch to progress view
            this.showUpdateProgress();
            
            // Start real installation process
            const result = await window.ApiService.installUpdate();
            
            if (result.success) {
                // Monitor installation progress
                this.monitorUpdateProgress();
            } else {
                this.showUpdateError(result.error || 'Falha ao iniciar atualização');
            }
            
        } catch (error) {
            console.error('❌ Erro ao iniciar atualização:', error);
            this.showUpdateError('Erro ao iniciar atualização: ' + error.message);
        }
    },

    /**
     * Show update progress view
     */
    showUpdateProgress() {
        const updateInfo = document.getElementById('update-info');
        const updateProgress = document.getElementById('update-progress');
        const updateActions = document.getElementById('update-actions');
        const updateProgressActions = document.getElementById('update-progress-actions');
        
        if (updateInfo) updateInfo.style.display = 'none';
        if (updateProgress) updateProgress.style.display = 'block';
        if (updateActions) updateActions.style.display = 'none';
        if (updateProgressActions) updateProgressActions.style.display = 'flex';
    },

    /**
     * Monitor real update progress
     */
    monitorUpdateProgress() {
        this.updateProgressInterval = setInterval(async () => {
            try {
                const statusResult = await window.ApiService.getUpdateStatus();
                
                if (statusResult.success && statusResult.data) {
                    const status = statusResult.data;
                    
                    // Update progress UI
                    this.updateProgressUI(status);
                    
                    // Check if installation is complete
                    if (status.status === 'success') {
                        this.handleUpdateSuccess();
                        clearInterval(this.updateProgressInterval);
                    } else if (status.status === 'error') {
                        this.handleUpdateError(status.error);
                        clearInterval(this.updateProgressInterval);
                    }
                }
                
            } catch (error) {
                console.error('❌ Erro ao monitorar progresso:', error);
                this.handleUpdateError('Erro ao monitorar progresso da atualização');
                clearInterval(this.updateProgressInterval);
            }
        }, 2000); // Check every 2 seconds
    },

    /**
     * Update progress UI elements
     */
    updateProgressUI(status) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const currentStepMessage = document.getElementById('current-step-message');
        
        // Update progress bar
        if (progressFill) {
            progressFill.style.width = `${status.progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(status.progress)}%`;
        }
        
        // Update current step message
        if (currentStepMessage) {
            currentStepMessage.textContent = status.currentStep || status.message;
        }
        
        // Update step indicators based on progress
        this.updateStepIndicators(status.progress);
    },

    /**
     * Update step indicator states based on progress
     */
    updateStepIndicators(progress) {
        const steps = [
            { id: 'step-checking', threshold: 20 },
            { id: 'step-backup', threshold: 40 },
            { id: 'step-download', threshold: 60 },
            { id: 'step-install', threshold: 80 },
            { id: 'step-restart', threshold: 100 }
        ];
        
        steps.forEach((step, index) => {
            const element = document.getElementById(step.id);
            if (element) {
                element.classList.remove('active', 'completed', 'error');
                
                if (progress >= step.threshold) {
                    element.classList.add('completed');
                } else if (index === 0 || progress > steps[index - 1].threshold) {
                    element.classList.add('active');
                }
            }
        });
    },

    /**
     * Handle successful update completion
     */
    handleUpdateSuccess() {
        const currentStepMessage = document.getElementById('current-step-message');
        const closeAfterBtn = document.getElementById('update-close-after');
        
        if (currentStepMessage) {
            currentStepMessage.innerHTML = '✅ Atualização concluída com sucesso!<br><small>A aplicação foi reiniciada com a nova versão.</small>';
        }
        
        if (closeAfterBtn) {
            closeAfterBtn.disabled = false;
            closeAfterBtn.textContent = 'Fechar';
        }
        
        // Reload version info to show new version
        setTimeout(() => {
            this.loadVersionInfo();
        }, 2000);
        
        console.log('✅ Atualização concluída com sucesso');
    },

    /**
     * Handle update error
     */
    handleUpdateError(errorMessage) {
        const currentStepMessage = document.getElementById('current-step-message');
        const closeAfterBtn = document.getElementById('update-close-after');
        
        if (currentStepMessage) {
            currentStepMessage.innerHTML = `❌ Erro durante a atualização:<br><small>${errorMessage}</small>`;
        }
        
        if (closeAfterBtn) {
            closeAfterBtn.disabled = false;
            closeAfterBtn.textContent = 'Fechar';
        }
        
        // Mark all current active steps as error
        const activeSteps = document.querySelectorAll('.progress-step.active');
        activeSteps.forEach(step => {
            step.classList.remove('active');
            step.classList.add('error');
        });
        
        console.error(`❌ Erro na atualização: ${errorMessage}`);
    },

    /**
     * Show update error in modal
     */
    showUpdateError(errorMessage) {
        const currentStepMessage = document.getElementById('current-step-message');
        
        if (currentStepMessage) {
            currentStepMessage.innerHTML = `❌ ${errorMessage}`;
        }
        
        // Show error state
        this.handleUpdateError(errorMessage);
    },

    /**
     * Reset update modal to initial state
     */
    resetUpdateModal() {
        const updateInfo = document.getElementById('update-info');
        const updateProgress = document.getElementById('update-progress');
        const updateActions = document.getElementById('update-actions');
        const updateProgressActions = document.getElementById('update-progress-actions');
        const requirementsContainer = document.getElementById('update-requirements');
        
        if (updateInfo) updateInfo.style.display = 'block';
        if (updateProgress) updateProgress.style.display = 'none';
        if (updateActions) updateActions.style.display = 'flex';
        if (updateProgressActions) updateProgressActions.style.display = 'none';
        if (requirementsContainer) requirementsContainer.style.display = 'none';
        
        // Reset progress bar
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
        
        // Reset all progress steps
        const stepIds = ['step-checking', 'step-backup', 'step-download', 'step-install', 'step-restart'];
        stepIds.forEach(stepId => {
            const stepElement = document.getElementById(stepId);
            if (stepElement) {
                stepElement.classList.remove('active', 'completed', 'error');
            }
        });
        
        // Reset buttons
        const startBtn = document.getElementById('update-start');
        const closeAfterBtn = document.getElementById('update-close-after');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<span class="btn-icon">🔄</span>Atualizar Agora';
            startBtn.style.background = '';
        }
        if (closeAfterBtn) {
            closeAfterBtn.disabled = true;
            closeAfterBtn.textContent = 'Fechar';
        }
    }
};

// Export to global scope
window.App = App;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
