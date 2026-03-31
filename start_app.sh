#!/bin/bash

# Start DermaCheck App
echo "🚀 Starting DermaCheck App..."

# Navigate to expo app directory
cd expo-app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the Expo development server
echo "🔬 Starting Expo development server..."
npm start

