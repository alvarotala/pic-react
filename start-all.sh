#!/bin/bash

echo "🎨 Starting Pictionary Multiplayer Game..."
echo "This is a multiplayer-only game - you need at least 2 players!"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if needed
echo ""
echo "Installing dependencies..."

echo "📱 Installing mobile app dependencies..."
npm install

echo "🖥️ Installing server dependencies..."
cd server
npm install

echo "🌐 Installing web client dependencies..."
cd ../web-client
npm install

echo ""
echo "✅ All dependencies installed!"
echo ""

# Start all services
echo "🚀 Starting all services..."
echo ""

echo "1️⃣ Starting backend server on http://localhost:3001"
cd ../server
npm start &
SERVER_PID=$!

echo "2️⃣ Starting web client on http://localhost:3000"
cd ../web-client
npm start &
WEB_PID=$!



echo ""
echo "🎉 All services are starting!"
echo ""
echo "📱 Mobile app: Expo development server (QR code will appear below)"
echo "🌐 Web client: http://localhost:3000"
echo "🖥️ Backend server: http://localhost:3001"
echo ""
echo "📱 Scan the QR code with Expo Go app on your mobile device"
echo "To stop all services, press Ctrl+C"



echo "3️⃣ Starting mobile app"
cd ..
npm start


# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $SERVER_PID $WEB_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM
