@echo off
REM One-click local dev: starts BOTH servers in their own windows.
REM Works from anywhere (desktop, etc.) because the project path is absolute.
REM Double-click this file, then open http://localhost:3000

set "PROJECT=C:\Users\jssps\OneDrive\Desktop\image-compression-main"

echo Starting CompressHub backend (port 8000)...
start "CompressHub Backend" cmd /k "cd /d %PROJECT% && backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo Starting CompressHub frontend (port 3000)...
start "CompressHub Frontend" cmd /k "cd /d %PROJECT%\frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Open http://localhost:3000 in your browser once they're ready.
echo (Keep both windows open while using the app. Close them to stop.)
echo.
pause
