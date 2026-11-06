@echo off
rem Double-click to start the NFC scan logger on Windows.
where py >nul 2>nul && (py -3 "%~dp0nfc_logger.py" %*) || (python "%~dp0nfc_logger.py" %*)
if errorlevel 9009 (echo Python 3 is not installed. Get it from https://www.python.org/downloads/ & pause)
