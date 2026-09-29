@echo off
:: -------------------------------------------------
:: Charlotte – FastAPI backend launch script
:: -------------------------------------------------
:: Ensure telemetry is disabled for this process (defensive)
set DISABLE_TELEMETRY=1
set NODE_OPTIONS=

:: Change to the backend directory you gave me
cd /d "C:\Users\abhin\ML project\Charlotte\backend"

:: Start the FastAPI app
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000