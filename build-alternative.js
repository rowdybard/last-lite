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
  
  console.log('Source path:', srcPath);
  console.log('Dist path:', distPath);
  console.log('Source exists:', fs.existsSync(srcPath));
  console.log('Dist exists:', fs.existsSync(distPath));
  
  // List files in src directory
  if (fs.existsSync(srcPath)) {
    const srcFiles = fs.readdirSync(srcPath);
    console.log('Files in src:', srcFiles);
  }
  
  // Ensure dist directory exists
  if (!fs.existsSync(distPath)) {
    console.log('Creating dist directory...');
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  // Copy homepage.html
  const homepageSrc = path.join(srcPath, 'homepage.html');
  const homepageDist = path.join(distPath, 'homepage.html');
  console.log('Homepage src:', homepageSrc);
  console.log('Homepage dist:', homepageDist);
  console.log('Homepage src exists:', fs.existsSync(homepageSrc));
  
  if (fs.existsSync(homepageSrc)) {
    try {
      fs.copyFileSync(homepageSrc, homepageDist);
      console.log('✅ Copied homepage.html to dist');
    } catch (error) {
      console.error('❌ Failed to copy homepage.html:', error.message);
    }
  } else {
    console.error('❌ homepage.html not found in src directory');
    
    // Try to find the file in alternative locations
    console.log('🔍 Searching for homepage.html in alternative locations...');
    const searchPaths = [
      path.join(process.cwd(), 'client/src/homepage.html'),
      path.join(process.cwd(), 'src/client/src/homepage.html'),
      path.join(clientPath, 'homepage.html'),
      path.join(clientPath, 'src/homepage.html')
    ];
    
    for (const searchPath of searchPaths) {
      console.log('Checking:', searchPath);
      if (fs.existsSync(searchPath)) {
        console.log('✅ Found homepage.html at:', searchPath);
        try {
          fs.copyFileSync(searchPath, homepageDist);
          console.log('✅ Copied homepage.html from alternative location');
          break;
        } catch (error) {
          console.error('❌ Failed to copy from alternative location:', error.message);
        }
      }
    }
  }
  
  // Copy polished-game.html
  const gameSrc = path.join(srcPath, 'polished-game.html');
  const gameDist = path.join(distPath, 'polished-game.html');
  console.log('Game src:', gameSrc);
  console.log('Game dist:', gameDist);
  console.log('Game src exists:', fs.existsSync(gameSrc));
  
  if (fs.existsSync(gameSrc)) {
    try {
      fs.copyFileSync(gameSrc, gameDist);
      console.log('✅ Copied polished-game.html to dist');
    } catch (error) {
      console.error('❌ Failed to copy polished-game.html:', error.message);
    }
  } else {
    console.error('❌ polished-game.html not found in src directory');
    
    // Try to find the file in alternative locations
    console.log('🔍 Searching for polished-game.html in alternative locations...');
    const searchPaths = [
      path.join(process.cwd(), 'client/src/polished-game.html'),
      path.join(process.cwd(), 'src/client/src/polished-game.html'),
      path.join(clientPath, 'polished-game.html'),
      path.join(clientPath, 'src/polished-game.html')
    ];
    
    for (const searchPath of searchPaths) {
      console.log('Checking:', searchPath);
      if (fs.existsSync(searchPath)) {
        console.log('✅ Found polished-game.html at:', searchPath);
        try {
          fs.copyFileSync(searchPath, gameDist);
          console.log('✅ Copied polished-game.html from alternative location');
          break;
        } catch (error) {
          console.error('❌ Failed to copy from alternative location:', error.message);
        }
      }
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
