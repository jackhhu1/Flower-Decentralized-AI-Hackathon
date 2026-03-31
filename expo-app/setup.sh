#!/bin/bash

# DermaCheck Expo App Setup Script
# This script helps set up the development environment

echo "🏥 Setting up DermaCheck - AI-Powered Skin Cancer Detection App"
echo "================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to v16 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Expo CLI. Please install manually:"
        echo "   npm install -g @expo/cli"
        exit 1
    fi
fi

echo "✅ Expo CLI installed"

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check your internet connection and try again."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p assets
mkdir -p src/screens
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/theme

echo "✅ Directory structure created"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the expo-app directory."
    exit 1
fi

# Create placeholder assets if they don't exist
if [ ! -f "assets/icon.png" ]; then
    echo "⚠️  Placeholder assets not found. Creating placeholder files..."
    echo "   Please replace these with actual app icons and splash screens:"
    echo "   - assets/icon.png (1024x1024)"
    echo "   - assets/splash.png (1284x2778)"
    echo "   - assets/adaptive-icon.png (1024x1024)"
    echo "   - assets/favicon.png (48x48)"
    
    # Create placeholder files
    touch assets/icon.png
    touch assets/splash.png
    touch assets/adaptive-icon.png
    touch assets/favicon.png
fi

echo "✅ Asset placeholders created"

# Display next steps
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Replace placeholder assets in the assets/ folder with your app icons"
echo "2. Update the API endpoint in src/services/apiService.js"
echo "3. Start the development server:"
echo "   npm start"
echo ""
echo "4. Run on your preferred platform:"
echo "   npm run ios     # iOS Simulator"
echo "   npm run android # Android Emulator"
echo "   npm run web     # Web browser"
echo ""
echo "5. Scan the QR code with Expo Go app on your mobile device"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "⚠️  Medical Disclaimer: This app is for educational purposes only."
echo "   Always consult a healthcare professional for medical advice."

