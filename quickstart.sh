#!/bin/bash

# Fleetros Backoffice Dashboard - Quick Start Script
# This script helps you get started quickly with the project

set -e  # Exit on error

echo "🚀 Fleetros Backoffice Dashboard - Quick Start"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION. Version 20+ is recommended."
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo "   This may take a few minutes..."
npm install

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Display next steps
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure your Spring Boot backend is running at:"
echo "   http://localhost:8082"
echo ""
echo "2. Review and update .env.local if needed"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Open your browser and visit:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - README.md         : Overview and features"
echo "   - INSTALLATION.md   : Detailed setup guide"
echo "   - PROJECT_SUMMARY.md: Complete project summary"
echo ""
echo "Happy coding! 🚀"
