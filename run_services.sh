#!/bin/bash

echo "🚀 Starting AI Voice Application Services..."
echo

# Function to kill processes on specific ports
cleanup() {
    echo "🧹 Cleaning up processes..."
    
    # Kill processes on port 5000 (backend)
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Killing process on port 5000..."
        lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    
    # Kill processes on port 5173 (frontend)
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Killing process on port 5173..."
        lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    
    # Kill stripe processes
    pkill -f "stripe listen" 2>/dev/null
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🧹 Cleaning up existing processes..."
# Kill existing processes
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
fi
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
fi
pkill -f "stripe listen" 2>/dev/null

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
sleep 3

# Start frontend in background
echo "Starting Frontend (React)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Start Stripe CLI in background (if available)
if command -v stripe >/dev/null 2>&1; then
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
if command -v stripe >/dev/null 2>&1; then
    echo "   Stripe:   Listening for webhooks"
fi
echo
echo "📋 Logs available in:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
if command -v stripe >/dev/null 2>&1; then
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
