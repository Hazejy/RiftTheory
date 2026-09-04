@echo off
setlocal
cd /d "%~dp0"
if not exist ".upstream-cache\tools\node_modules\bun\bin\bun.exe" (
  echo Local Bun runtime missing. Follow docs\draftgap-base.md first.
  pause
  exit /b 1
)
if not exist "draftgap\apps\frontend\dist\index.html" (
  echo Frontend build missing. Follow docs\draftgap-base.md to build RiftTheory.
  pause
  exit /b 1
)
set "PATH=%CD%\.upstream-cache\tools\node_modules\bun\bin;%PATH%"
echo RiftTheory: http://127.0.0.1:3000
echo Open the address once startup completes. Keep this window open.
echo Press Ctrl+C to stop RiftTheory.
".upstream-cache\tools\node_modules\bun\bin\bun.exe" run --cwd draftgap/apps/frontend serve
if errorlevel 1 (
  echo RiftTheory could not start. Check whether port 3000 is already in use.
  pause
  exit /b 1
)
