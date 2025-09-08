#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isHeaded = process.argv.includes('--headed');

async function runE2E() {
  console.log('🚀 Starting Last-Lite E2E tests...');
  
  // Install browsers if needed
  console.log('📦 Installing Playwright browsers...');
  const installProcess = spawn('npx', ['playwright', 'install', 'chromium'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  await new Promise((resolve, reject) => {
    installProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Browser installation failed with code ${code}`));
    });
  });
  
  // Run Playwright tests
  console.log('🧪 Running E2E tests...');
  const testArgs = ['playwright', 'test'];
  if (isHeaded) {
    testArgs.push('--headed');
  }
  
  const testProcess = spawn('npx', testArgs, {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  const exitCode = await new Promise((resolve) => {
    testProcess.on('close', resolve);
  });
  
  process.exit(exitCode);
}

runE2E().catch((error) => {
  console.error('❌ E2E test runner failed:', error);
  process.exit(1);
});
