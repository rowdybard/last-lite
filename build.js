#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Last-Lite build process...');
console.log('Current working directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync(process.cwd()));

try {
  // Install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // Build server
  console.log('🔨 Building server...');
  execSync('cd server && npm ci && npm run build', { stdio: 'inherit' });

  // Build client
  console.log('🔨 Building client...');
  execSync('cd client && npm ci && npm run build', { stdio: 'inherit' });

  // Verify builds
  console.log('✅ Verifying builds...');
  const serverDist = path.join(process.cwd(), 'server', 'dist');
  const clientDist = path.join(process.cwd(), 'client', 'dist');

  if (!fs.existsSync(serverDist)) {
    throw new Error('Server build failed - dist directory not found');
  }

  if (!fs.existsSync(clientDist)) {
    throw new Error('Client build failed - dist directory not found');
  }

  console.log('📁 Server dist contents:', fs.readdirSync(serverDist));
  console.log('📁 Client dist contents:', fs.readdirSync(clientDist));

  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
