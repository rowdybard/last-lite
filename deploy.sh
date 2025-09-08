#!/bin/bash

# Last-Lite Deployment Script
echo "🚀 Starting Last-Lite deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build server
echo "🔨 Building server..."
cd server
npm ci
npm run build
cd ..

# Build client
echo "🔨 Building client..."
cd client
npm ci
npm run build
cd ..

# Verify builds
if [ ! -d "server/dist" ]; then
    echo "❌ Error: Server build failed - dist directory not found"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Error: Client build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Server dist: $(ls -la server/dist | wc -l) files"
echo "📁 Client dist: $(ls -la client/dist | wc -l) files"

# Start server
echo "🎮 Starting server..."
cd server
node dist/index.js
