/**
 * Techify Free Tools - Server Entry Point
 * Starts the Express server
 */

const app = require('./app');
const config = require('./config/environment');
const AuthService = require('./services/authService');

/**
 * Start the server
 */
function startServer() {
    const port = config.server.port;
    const host = config.server.host;
    
    const server = app.listen(port, () => {
        console.log('=================================');
        console.log('🚀 Techify Free Tools Server');
        console.log('=================================');
        console.log(`📍 Servidor rodando na porta ${port} - Auto-reload habilitado`);
        console.log(`🌐 Acesse: http://${host}:${port}`);
        console.log(`⚡ Atualização automática: ${config.app.updateInterval/1000}s - PM2 Watch Ativo!`);
        console.log('=================================');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n🛑 Recebido SIGTERM, encerrando servidor...');
        server.close(() => {
            console.log('✅ Servidor encerrado graciosamente');
            process.exit(0);
        });
    });
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Recebido SIGINT, encerrando servidor...');
        server.close(() => {
            console.log('✅ Servidor encerrado graciosamente');
            process.exit(0);
        });
    });
    
    // Clean expired sessions periodically (every hour)
    setInterval(() => {
        AuthService.cleanExpiredSessions();
    }, 60 * 60 * 1000);
    
    return server;
}

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { startServer };
