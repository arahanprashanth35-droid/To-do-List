@echo off
echo Starting To-Do List Backend...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run the Flask app
python app.py
