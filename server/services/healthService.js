/**
 * Health Service
 * Handles connectivity testing for multiple resources
 */

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('../config/environment');

const execAsync = promisify(exec);

class HealthService {
    /**
     * Execute command with proper timeout handling
     * @param {string} command - Command to execute
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<Object>} Command result
     */
    static async executeWithTimeout(command, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Command timeout after ${timeout}ms`));
            }, timeout);

            exec(command, (error, stdout, stderr) => {
                clearTimeout(timeoutId);
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    /**
     * Test internet connectivity via ping to 1.1.1.1
     * @returns {Promise<Object>} Test results
     */
    static async testInternetConnectivity() {
        try {
            console.log('🌐 Testando conectividade com a internet (1.1.1.1)...');
            
            // Try HTTP request first (faster and more reliable)
            try {
                const startTime = Date.now();
                const response = await Promise.race([
                    axios.get('https://1.1.1.1', { 
                        timeout: 3000,
                        validateStatus: () => true // Accept any status
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('HTTP timeout')), 3000)
                    )
                ]);
                
                const responseTime = Date.now() - startTime;
                console.log(`✅ Internet: OK (HTTP ${response.status} - ${responseTime}ms)`);
                
                return {
                    status: 'Ok',
                    details: `Conectividade OK (${responseTime}ms)`
                };
            } catch (httpError) {
                // Fallback to ping if HTTP fails
                const command = process.platform === 'win32' 
                    ? 'ping -n 1 -w 3000 1.1.1.1' 
                    : 'ping -c 1 -W 3 1.1.1.1';
                
                const { stdout } = await this.executeWithTimeout(command, 4000);
                
                // Check if ping was successful
                const success = stdout.includes('TTL=') || stdout.includes('ttl=') || 
                               stdout.includes('time=') || stdout.includes('1 received') ||
                               stdout.includes('bytes from');
                
                console.log(success ? '✅ Internet: OK (ping)' : '❌ Internet: Fail');
                
                return {
                    status: success ? 'Ok' : 'Fail',
                    details: success ? 'Conectividade OK (ping)' : 'Sem conectividade'
                };
            }
        } catch (error) {
            console.log('❌ Internet: Fail -', error.message);
            return {
                status: 'Fail',
                details: 'Timeout ou erro na conexão'
            };
        }
    }

    /**
     * Test Techify server connectivity via tunnel.techify.free:62333
     * @returns {Promise<Object>} Test results
     */
    static async testTechifyServer() {
        try {
            console.log('🔧 Testando servidor Techify (tunnel.techify.free:62333)...');
            
            // Try multiple approaches for better compatibility
            let success = false;
            let method = '';
            
            try {
                // Method 1: Try with netcat (most reliable)
                const ncCommand = process.platform === 'win32'
                    ? 'powershell "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect(\'tunnel.techify.free\', 62333); $tcp.Close(); Write-Output \'Connected\' } catch { Write-Output \'Failed\' }"'
                    : 'timeout 3 bash -c "echo >/dev/tcp/tunnel.techify.free/62333" 2>/dev/null && echo "Connected" || echo "Failed"';
                
                const { stdout } = await this.executeWithTimeout(ncCommand, 4000);
                success = stdout.includes('Connected');
                method = 'TCP';
                
            } catch (tcpError) {
                // Method 2: Try with telnet-like approach
                try {
                    const telnetCommand = process.platform === 'win32'
                        ? 'powershell "Test-NetConnection -ComputerName tunnel.techify.free -Port 62333 -InformationLevel Quiet -WarningAction SilentlyContinue"'
                        : 'nc -z -w3 tunnel.techify.free 62333 2>/dev/null && echo "True" || echo "False"';
                    
                    const { stdout } = await this.executeWithTimeout(telnetCommand, 4000);
                    success = stdout.trim() === 'True';
                    method = 'NetConnection';
                    
                } catch (netError) {
                    console.log('⚠️ Ambos os métodos falharam, assumindo servidor inacessível');
                    success = false;
                    method = 'None';
                }
            }
            
            console.log(success ? `✅ Servidor Techify: OK (${method})` : `❌ Servidor Techify: Fail (${method})`);
            
            return {
                status: success ? 'Ok' : 'Fail',
                details: success ? `Servidor alcançável (${method})` : `Servidor não alcançável (${method})`
            };
        } catch (error) {
            console.log('❌ Servidor Techify: Fail -', error.message);
            return {
                status: 'Fail',
                details: 'Timeout ou erro na conexão'
            };
        }
    }

    /**
     * Test subdomain status
     * @param {string} subdomain - The current subdomain
     * @returns {Promise<Object>} Test results
     */
    static async testSubdomainStatus(subdomain) {
        console.log(`📝 Verificando status do subdomínio: ${subdomain}`);
        
        const isWaiting = !subdomain || subdomain === 'waiting' || subdomain === '';
        
        const result = {
            status: isWaiting ? 'Aguardando' : 'OK',
            details: isWaiting ? 'Subdomínio não configurado' : `Subdomínio: ${subdomain}`
        };
        
        console.log(isWaiting ? '⏳ Subdomínio: Aguardando' : '✅ Subdomínio: OK');
        
        return result;
    }

    /**
     * Test tunnel connections via netstat
     * @param {string} subdomain - The current subdomain for conditional logic
     * @returns {Promise<Object>} Test results
     */
    static async testTunnelConnections(subdomain) {
        try {
            console.log('🔌 Verificando conexões do túnel (porta 62333)...');
            
            // If subdomain is waiting, return waiting status
            if (!subdomain || subdomain === 'waiting' || subdomain === '') {
                console.log('⏳ Túnel: Aguardando (subdomínio não configurado)');
                return {
                    status: 'Aguardando',
                    details: 'Aguardando configuração do subdomínio'
                };
            }
            
            let connectionCount = 0;
            let success = false;
            
            try {
                // Check established connections on port 62333 with improved command
                const command = process.platform === 'win32'
                    ? 'netstat -an 2>nul | findstr ":62333" | findstr "ESTABLISHED" | find /c "ESTABLISHED"'
                    : 'netstat -an 2>/dev/null | grep ":62333" | grep -c "ESTABLISHED" || echo "0"';
                
                const { stdout } = await this.executeWithTimeout(command, 3000);
                
                // Parse connection count
                const countStr = stdout.trim();
                connectionCount = parseInt(countStr) || 0;
                
                // Need at least 4 ESTABLISHED connections
                success = connectionCount >= 4;
                
            } catch (netstatError) {
                console.log('⚠️ Erro no netstat, tentando método alternativo...');
                
                // Alternative method: try ss command (if available)
                try {
                    const altCommand = process.platform === 'win32'
                        ? 'powershell "Get-NetTCPConnection -LocalPort 62333 -State Established 2>$null | Measure-Object | Select-Object -ExpandProperty Count"'
                        : 'ss -tn state established sport = :62333 2>/dev/null | wc -l || echo "0"';
                    
                    const { stdout: altStdout } = await this.executeWithTimeout(altCommand, 3000);
                    connectionCount = parseInt(altStdout.trim()) || 0;
                    success = connectionCount >= 4;
                    
                } catch (altError) {
                    console.log('⚠️ Métodos alternativos falharam, assumindo 0 conexões');
                    connectionCount = 0;
                    success = false;
                }
            }
            
            console.log(success 
                ? `✅ Túnel: OK (${connectionCount} conexões)` 
                : `❌ Túnel: ${connectionCount >= 1 ? 'Fail' : 'Fail'} (${connectionCount} conexões, mínimo 4)`);
            
            return {
                status: success ? 'OK' : 'Fail',
                details: `${connectionCount} conexões estabelecidas (mín. 4)`
            };
        } catch (error) {
            console.log('❌ Túnel: Fail -', error.message);
            return {
                status: 'Fail',
                details: 'Erro ao verificar conexões'
            };
        }
    }

    /**
     * Test external access to Coolify subdomain
     * @param {string} subdomain - The subdomain to test
     * @returns {Promise<Object>} Test results
     */
    static async testExternalAccess(subdomain) {
        console.log(`🌍 Testando alcance externo para subdomínio: ${subdomain}`);
        
        // If subdomain is waiting, return waiting status
        if (!subdomain || subdomain === 'waiting' || subdomain === '') {
            console.log('⏳ Alcance Externo: Aguardando (subdomínio não configurado)');
            return {
                status: 'Aguardando',
                details: 'Aguardando configuração do subdomínio',
                url: 'N/A'
            };
        }
        
        const url = `https://coolify.${subdomain}.techify.free/login`;
        
        try {
            console.log(`🔍 Testando acesso externo: ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            
            const response = await axios.get(url, { 
                timeout: 5500,
                signal: controller.signal,
                validateStatus: function (status) {
                    // Accept any status < 600 as a valid response
                    return status < 600;
                },
                maxRedirects: 3,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; TechifyHealthCheck/1.0)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            clearTimeout(timeoutId);
            
            // Consider 200-299 as OK, others as accessible but different status
            const isOk = response.status >= 200 && response.status < 400;
            
            console.log(`✅ Alcance Externo: ${isOk ? 'OK' : 'OK'} (Status: ${response.status})`);
            
            return {
                status: 'OK',
                details: `HTTP ${response.status} - Acessível`,
                url: url,
                statusCode: response.status
            };
        } catch (error) {
            console.log(`❌ Alcance Externo: Fail - ${error.message}`);
            
            let errorDetails = 'Erro na conexão';
            
            if (error.code === 'ENOTFOUND') {
                errorDetails = 'Domínio não encontrado';
            } else if (error.code === 'ECONNREFUSED') {
                errorDetails = 'Conexão recusada';
            } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError' || error.message.includes('timeout')) {
                errorDetails = 'Timeout (6s)';
            } else if (error.code === 'ECONNRESET') {
                errorDetails = 'Conexão resetada';
            } else if (error.code === 'CERT_HAS_EXPIRED') {
                errorDetails = 'Certificado SSL expirado';
            }
            
            return {
                status: 'Fail',
                details: errorDetails,
                url: url,
                statusCode: error.response ? error.response.status : null
            };
        }
    }

    /**
     * Run all tests and get complete status
     * @param {string} subdomain - The subdomain to test
     * @returns {Promise<Object>} Complete test results
     */
    static async runAllTests(subdomain) {
        console.log('🚀 Iniciando todos os testes de conectividade...');
        
        try {
            // Run all tests with individual timeout handling
            const testPromises = [
                this.testInternetConnectivity().catch(error => ({
                    status: 'Fail',
                    details: `Erro no teste: ${error.message}`
                })),
                this.testTechifyServer().catch(error => ({
                    status: 'Fail', 
                    details: `Erro no teste: ${error.message}`
                })),
                this.testSubdomainStatus(subdomain).catch(error => ({
                    status: 'Fail',
                    details: `Erro no teste: ${error.message}`
                })),
                this.testTunnelConnections(subdomain).catch(error => ({
                    status: 'Fail',
                    details: `Erro no teste: ${error.message}`
                })),
                this.testExternalAccess(subdomain).catch(error => ({
                    status: 'Fail',
                    details: `Erro no teste: ${error.message}`,
                    url: `https://coolify.${subdomain}.techify.free/login`
                }))
            ];
            
            // Add global timeout for all tests
            const allTestsPromise = Promise.all(testPromises);
            const globalTimeout = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Global timeout: todos os testes excederam 15 segundos'));
                }, 15000);
            });
            
            const [
                internetTest,
                techifyServerTest,
                subdomainTest,
                tunnelTest,
                externalTest
            ] = await Promise.race([allTestsPromise, globalTimeout]);
            
            const results = {
                subdomain: subdomain,
                timestamp: new Date().toLocaleString('pt-BR'),
                tests: {
                    internet: internetTest,
                    techifyServer: techifyServerTest,
                    subdomain: subdomainTest,
                    tunnel: tunnelTest,
                    externalAccess: externalTest
                }
            };
            
            console.log('✅ Todos os testes concluídos em', new Date().toLocaleString('pt-BR'));
            return results;
            
        } catch (error) {
            console.error('❌ Erro ao executar testes:', error);
            
            // Return partial results in case of global timeout
            return {
                subdomain: subdomain,
                timestamp: new Date().toLocaleString('pt-BR'),
                tests: {
                    internet: { status: 'Fail', details: 'Timeout global' },
                    techifyServer: { status: 'Fail', details: 'Timeout global' },
                    subdomain: { status: 'Fail', details: 'Timeout global' },
                    tunnel: { status: 'Fail', details: 'Timeout global' },
                    externalAccess: { status: 'Fail', details: 'Timeout global', url: `https://coolify.${subdomain}.techify.free/login` }
                },
                error: error.message
            };
        }
    }

    /**
     * Get current status with timestamp (legacy compatibility)
     * @param {string} subdomain - The subdomain to test
     * @returns {Promise<Object>} Complete status object
     */
    static async getCurrentStatus(subdomain) {
        return await this.runAllTests(subdomain);
    }
}

module.exports = HealthService;
