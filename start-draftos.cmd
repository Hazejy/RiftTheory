@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Python environment missing. Follow docs\local-app.md first.
  pause
  exit /b 1
)
if not exist "web\dist\index.html" (
  echo Frontend build missing. Run: npm.cmd --prefix web run build
  pause
  exit /b 1
)
echo DraftOS local workspace: http://127.0.0.1:8000
echo Open this address in your browser once the server reports startup complete.
echo Keep this window open. Press Ctrl+C to stop DraftOS.
".venv\Scripts\python.exe" -m src.draftos.web
if errorlevel 1 (
  echo DraftOS could not start. Check the message above, including whether port 8000 is in use.
  pause
  exit /b 1
)
