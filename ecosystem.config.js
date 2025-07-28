module.exports = {
  apps: [{
    name: 'local-app',
    script: 'server/server.js',
    watch: true,
    watch_delay: 1000,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      '.git'
    ],
    watch_options: {
      followSymlinks: false
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
