#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Alternative Build Script for Last-Lite');
console.log('This script avoids Rollup native dependency issues');

try {
  // Install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // Build server
  console.log('🔨 Building server...');
  execSync('cd server && npm ci && npm run build', { stdio: 'inherit' });

  // Build client with alternative approach
  console.log('🔨 Building client with alternative approach...');
  const clientPath = path.join(process.cwd(), 'client');
  const nodeModulesPath = path.join(clientPath, 'node_modules');
  const packageLockPath = path.join(clientPath, 'package-lock.json');
  
  // Remove node_modules and package-lock.json
  if (fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  if (fs.existsSync(packageLockPath)) {
    fs.unlinkSync(packageLockPath);
  }
  
  execSync('cd client && npm cache clean --force', { stdio: 'inherit' });
  execSync('cd client && npm install --no-optional --no-audit', { stdio: 'inherit' });
  
  // Try building with TypeScript only first
  console.log('🔨 Building client TypeScript...');
  execSync('cd client && npx tsc', { stdio: 'inherit' });
  
  // Then try Vite build
  console.log('🔨 Building client with Vite...');
  execSync('cd client && npx vite build', { stdio: 'inherit' });

  // Copy HTML files to dist (Vite build clears the directory)
  console.log('📋 Copying HTML files to dist...');
  const srcPath = path.join(clientPath, 'src');
  const distPath = path.join(clientPath, 'dist');
  
  // Copy homepage.html
  const homepageSrc = path.join(srcPath, 'homepage.html');
  const homepageDist = path.join(distPath, 'homepage.html');
  if (fs.existsSync(homepageSrc)) {
    fs.copyFileSync(homepageSrc, homepageDist);
    console.log('✅ Copied homepage.html to dist');
  }
  
  // Copy polished-game.html
  const gameSrc = path.join(srcPath, 'polished-game.html');
  const gameDist = path.join(distPath, 'polished-game.html');
  if (fs.existsSync(gameSrc)) {
    fs.copyFileSync(gameSrc, gameDist);
    console.log('✅ Copied polished-game.html to dist');
  }

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

  // Verify HTML files are in dist
  const homepageDist = path.join(clientDist, 'homepage.html');
  const gameDist = path.join(clientDist, 'polished-game.html');
  
  if (!fs.existsSync(homepageDist)) {
    throw new Error('homepage.html not found in client/dist');
  }
  
  if (!fs.existsSync(gameDist)) {
    throw new Error('polished-game.html not found in client/dist');
  }

  console.log('✅ Build completed successfully!');
  console.log(`📁 Server dist: ${serverDist}`);
  console.log(`📁 Client dist: ${clientDist}`);
  console.log('✅ HTML files verified in dist directory');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
