@echo off
echo ==========================================
echo    To-Do List Backend Setup
echo ==========================================
echo.

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment. Make sure Python is installed.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo    Setup Complete!
echo ==========================================
echo.
echo Run start.bat to start the backend server.
echo.
pause
