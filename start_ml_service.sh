#!/bin/bash

# Start ML Service for DermaCheck App
echo "🚀 Starting DermaCheck ML Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run the Flower setup first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Install additional requirements for ML service
echo "📦 Installing ML service dependencies..."
pip install flask==2.3.3 flask-cors==4.0.0 pillow==10.0.0

# Start the ML service
echo "🔬 Starting ML service on http://localhost:5000"
python ml_service.py

