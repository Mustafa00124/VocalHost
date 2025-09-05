#!/bin/bash

echo "🚀 Setting up AI Voice Application..."
echo

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill processes on specific ports
cleanup() {
    echo "🧹 Cleaning up processes..."
    
    # Kill processes on port 5000 (backend)
    if port_in_use 5000; then
        echo "Killing process on port 5000..."
        lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    
    # Kill processes on port 5173 (frontend)
    if port_in_use 5173; then
        echo "Killing process on port 5173..."
        lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    
    # Kill stripe processes
    pkill -f "stripe listen" 2>/dev/null
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🔍 Checking system requirements..."

# Check if Python 3 is installed
if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command_exists psql; then
    echo "⚠️  PostgreSQL is not installed. Installing via Homebrew..."
    if command_exists brew; then
        brew install postgresql@14
        brew services start postgresql@14
    else
        echo "❌ Homebrew is not installed. Please install PostgreSQL manually."
        echo "   Visit: https://www.postgresql.org/download/macosx/"
        exit 1
    fi
fi

# Check if Stripe CLI is installed
if ! command_exists stripe; then
    echo "⚠️  Stripe CLI is not installed. Installing via Homebrew..."
    if command_exists brew; then
        brew install stripe/stripe-cli/stripe
    else
        echo "⚠️  Please install Stripe CLI manually:"
        echo "   Visit: https://stripe.com/docs/stripe-cli"
    fi
fi

echo "✅ System requirements check completed!"
echo

echo "🧹 Cleaning up existing processes..."
# Kill existing processes
if port_in_use 5000; then
    lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
fi
if port_in_use 5173; then
    lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
fi
pkill -f "stripe listen" 2>/dev/null

echo "📦 Installing Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp example.env .env
    echo "⚠️  Please edit backend/.env file with your API keys before running the application."
fi

# Set up database
echo "🗄️  Setting up database..."
# Create database if it doesn't exist
psql -U postgres -h localhost -c "CREATE DATABASE ai_voice_assistant;" 2>/dev/null || echo "Database might already exist or using different credentials"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

cd ..

echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

echo "📁 Creating log directory..."
mkdir -p logs

echo "🚀 Starting services..."
echo

# Start backend in background
echo "Starting Backend (Flask)..."
cd backend
source venv/bin/activate
python run.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend in background
echo "Starting Frontend (React)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

# Start Stripe CLI in background (if available)
if command_exists stripe; then
    echo "Starting Stripe CLI..."
    stripe listen --forward-to localhost:5000/stripe/webhook > logs/stripe.log 2>&1 &
    STRIPE_PID=$!
else
    echo "⚠️  Stripe CLI not available - webhooks may not work"
fi

echo
echo "====================================================="
echo "🎉 All services started successfully!"
echo
echo "📍 Services running on:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:5173"
if command_exists stripe; then
    echo "   Stripe:   Listening for webhooks"
fi
echo
echo "📋 Logs available in:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
if command_exists stripe; then
    echo "   Stripe:   logs/stripe.log"
fi
echo
echo "⚠️  IMPORTANT: Make sure to configure your API keys in backend/.env"
echo "   Required keys: OPENROUTER_API_KEY, ELEVENLABS_API_KEY, etc."
echo
echo "Press Ctrl+C to stop all services"
echo "====================================================="
echo

# Wait for user input or signal
wait
