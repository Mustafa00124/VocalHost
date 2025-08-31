#!/bin/bash

echo "Starting AI Voice Application..."
echo

# Function to kill processes on specific ports
cleanup() {
    echo "Cleaning up processes..."
    
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

echo "Killing existing processes on ports 5000, 5173, and any stripe processes..."
cleanup() { :; }  # Temporarily disable cleanup function
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
fi
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
fi
pkill -f "stripe listen" 2>/dev/null

# Restore cleanup function
cleanup() {
    echo "Cleaning up processes..."
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Killing process on port 5000..."
        lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Killing process on port 5173..."
        lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    pkill -f "stripe listen" 2>/dev/null
    exit 0
}

echo
echo "Starting services..."
echo

# Create log directory if it doesn't exist
mkdir -p logs

# Start backend in background
echo "Starting Backend (Flask)..."
cd backend
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

# Start Stripe CLI in background
echo "Starting Stripe CLI..."
stripe listen --forward-to localhost:5000/stripe/webhook > logs/stripe.log 2>&1 &
STRIPE_PID=$!

echo
echo "====================================================="
echo "All services started!"
echo
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo "Stripe:   Listening for webhooks"
echo
echo "Logs are available in the logs/ directory:"
echo "  - Backend: logs/backend.log"
echo "  - Frontend: logs/frontend.log"
echo "  - Stripe: logs/stripe.log"
echo
echo "Press Ctrl+C to stop all services"
echo "====================================================="
echo

# Wait for user input or signal
wait
