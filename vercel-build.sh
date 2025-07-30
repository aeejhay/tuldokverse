#!/bin/bash
echo "🔧 Installing dependencies..."
npm install

echo "🏗️ Building React app..."
npm run build

echo "✅ Build completed!"
ls -la build/ 