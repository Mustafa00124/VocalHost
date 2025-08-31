@echo off
echo Starting AI Voice Application...
echo.

REM Kill any existing processes on the ports we'll use
echo Killing existing processes on ports 5000, 5173, and any stripe processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
taskkill /f /im stripe.exe 2>nul

echo.
echo Starting services...
echo.

REM Start backend in a new window
echo Starting Backend (Flask)...
start "Backend Server" cmd /k "cd backend && python run.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window  
echo Starting Frontend (React)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak

REM Start Stripe CLI in a new window
echo Starting Stripe CLI...
start "Stripe CLI" cmd /k "stripe listen --forward-to localhost:5000/stripe/webhook"

echo.
echo =====================================================
echo All services started!
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173  
echo Stripe:   Listening for webhooks
echo.
echo Press Ctrl+C in each window to stop the services
echo =====================================================
echo.
pause
