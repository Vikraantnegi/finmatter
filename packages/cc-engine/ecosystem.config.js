/**
 * PM2 ecosystem configuration for AutoTune Agent
 *
 * This allows the agent to run as a background daemon/service
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop autotune-agent
 *   pm2 logs autotune-agent
 *   pm2 status
 */

const path = require('path');

module.exports = {
  apps: [
    {
      name: 'autotune-agent',
      script: path.join(__dirname, 'start-agent.js'),
      cwd: __dirname,
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './test-results/pm2-error.log',
      out_file: './test-results/pm2-out.log',
      log_file: './test-results/pm2-combined.log',
      time: true,
      merge_logs: true,
      // Restart on file changes (optional - set to false for production)
      ignore_watch: ['node_modules', 'dist', 'test-results'],
    },
  ],
};
