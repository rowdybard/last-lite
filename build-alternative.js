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
  
  // Verify server build
  console.log('🔍 Verifying server build...');
  const serverDistPath = path.join(process.cwd(), 'server', 'dist');
  const socketMainPath = path.join(serverDistPath, 'socket-main.js');
  if (fs.existsSync(socketMainPath)) {
    console.log('✅ socket-main.js found at:', socketMainPath);
  } else {
    console.log('❌ socket-main.js NOT found at:', socketMainPath);
    console.log('Server dist contents:', fs.readdirSync(serverDistPath));
  }

  // Run database migration
  console.log('🗄️ Running database migration...');
  try {
    execSync('cd server && node dist/database/migrate-standalone.js', { stdio: 'inherit' });
    console.log('✅ Database migration completed');
  } catch (error) {
    console.log('⚠️ Database migration failed, but continuing...');
    console.log('This might be expected if tables already exist');
  }

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
  
  // Copy HTML files BEFORE Vite build (since Vite clears the directory)
  console.log('📋 Copying HTML files to dist BEFORE Vite build...');
  const srcPath = path.join(clientPath, 'src');
  const distPath = path.join(clientPath, 'dist');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distPath)) {
    console.log('Creating dist directory...');
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  // Copy HTML files
  const htmlFiles = ['homepage.html', 'polished-game.html'];
  for (const htmlFile of htmlFiles) {
    const srcFile = path.join(srcPath, htmlFile);
    const distFile = path.join(distPath, htmlFile);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, distFile);
      console.log(`✅ Copied ${htmlFile} to dist`);
    } else {
      console.error(`❌ ${htmlFile} not found in src`);
    }
  }
  
  // Try building with TypeScript only first
  console.log('🔨 Building client TypeScript...');
  execSync('cd client && npx tsc', { stdio: 'inherit' });
  
  // Then try Vite build (this will clear and rebuild, but our HTML files are already there)
  console.log('🔨 Building client with Vite...');
  execSync('cd client && npx vite build', { stdio: 'inherit' });
  
  // Re-copy HTML files after Vite build (in case it cleared them)
  console.log('📋 Re-copying HTML files after Vite build...');
  for (const htmlFile of htmlFiles) {
    const srcFile = path.join(srcPath, htmlFile);
    const distFile = path.join(distPath, htmlFile);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, distFile);
      console.log(`✅ Re-copied ${htmlFile} to dist`);
    }
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
  
  // List all files in client/dist for debugging
  console.log('📋 Files in client/dist:');
  const clientDistFiles = fs.readdirSync(clientDist);
  clientDistFiles.forEach(file => {
    const filePath = path.join(clientDist, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.isDirectory() ? 'dir' : 'file'})`);
  });
  
  // Show the exact paths the server will look for
  console.log('🔍 Server will look for files at:');
  console.log(`  - Homepage: ${path.join(clientDist, 'homepage.html')}`);
  console.log(`  - Game: ${path.join(clientDist, 'polished-game.html')}`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
