#!/usr/bin/env node
/**
 * Internal Scripts Entry Point
 *
 * This file provides access to internal testing/development scripts
 * that shouldn't be exposed in package.json
 *
 * Usage:
 *   tsx scripts.ts <command> [args...]
 *
 * Commands:
 *   test              - Run parser tests
 *   test:generate     - Generate expected JSON files
 *   agent             - Run autotune agent manually
 *   agent:start       - Start agent as background service
 *   agent:stop        - Stop agent
 *   agent:restart     - Restart agent
 *   agent:logs        - View agent logs
 *   agent:status      - Check agent status
 *   feedback          - Run feedback loop
 */

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case 'test':
      await runScript(
        'src/testing/tune-statement-parsers/workflows/test.ts',
        args,
      );
      break;

    case 'test:generate':
      await runScript('src/testing/tune-statement-parsers/workflows/test.ts', [
        '--generate-expected',
        ...args,
      ]);
      break;

    case 'agent':
      await runScript(
        'src/testing/tune-statement-parsers/agents/auto-tune.ts',
        args,
      );
      break;

    case 'agent:start':
      await runCommand('pm2', ['start', 'ecosystem.config.js']);
      break;

    case 'agent:stop':
      await runCommand('pm2', ['stop', 'autotune-agent']);
      break;

    case 'agent:restart':
      await runCommand('pm2', ['restart', 'autotune-agent']);
      break;

    case 'agent:logs':
      await runCommand('pm2', ['logs', 'autotune-agent', ...args]);
      break;

    case 'agent:status':
      await runCommand('pm2', ['status', 'autotune-agent']);
      break;

    case 'feedback':
      await runScript(
        'src/testing/tune-statement-parsers/agents/feedback-loop.ts',
        args,
      );
      break;

    case 'feedback:auto':
      await runScript(
        'src/testing/tune-statement-parsers/agents/feedback-loop.ts',
        ['--auto-apply', ...args],
      );
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('\nAvailable commands:');
      console.log('  test              - Run parser tests');
      console.log('  test:generate     - Generate expected JSON files');
      console.log('  agent             - Run autotune agent manually');
      console.log('  agent:start       - Start agent as background service');
      console.log('  agent:stop        - Stop agent');
      console.log('  agent:restart     - Restart agent');
      console.log('  agent:logs        - View agent logs');
      console.log('  agent:status      - Check agent status');
      console.log('  feedback          - Run feedback loop');
      console.log('  feedback:auto     - Run feedback loop with auto-apply');
      process.exit(1);
  }
}

async function runScript(scriptPath: string, args: string[]): Promise<void> {
  const { spawn } = await import('child_process');
  const path = await import('path');
  const tsxPath = path.join(
    __dirname,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
  );

  return new Promise((resolve, reject) => {
    const child = spawn(tsxPath, [scriptPath, ...args], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
}

async function runCommand(command: string, args: string[]): Promise<void> {
  const { spawn } = await import('child_process');

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
