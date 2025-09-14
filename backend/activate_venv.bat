@echo off
echo Activating Python 3.10 virtual environment...
call venv_310\Scripts\activate.bat
echo Virtual environment activated!
echo Python version:
python --version
echo.
echo To run the backend:
echo python run.py
echo.
echo To deactivate:
echo deactivate
