#!/usr/bin/env node
/**
 * Wrapper script to start the AutoTune Agent
 * This is used by PM2 to reliably start the agent
 */

const { spawn } = require('child_process');
const path = require('path');

const tsxPath = path.join(
  __dirname,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);
const scriptPath = path.join(
  __dirname,
  'src',
  'testing',
  'tune-statement-parsers',
  'agents',
  'auto-tune.ts',
);

const child = spawn(tsxPath, [scriptPath], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', error => {
  console.error('Failed to start agent:', error);
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code || 0);
});

// Handle termination signals
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
