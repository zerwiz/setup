@echo off
REM AI Dev Suite TUI – Startup script (Windows CMD)
REM Installs Elixir if needed, then runs the app.
REM Run: start.bat

cd /d "%~dp0"

echo.
echo ● AI Dev Suite TUI – WhyNot Productions
echo Checking dependencies...
echo.

where mix >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Elixir not found. Installing...
    if exist "%ProgramData%\chocolatey\choco.exe" (
        "%ProgramData%\chocolatey\choco.exe" install elixir -y
    ) else (
        echo.
        echo Please install Elixir first:
        echo   winget install Elixir.Elixir
        echo   or: https://elixir-lang.org/install.html
        echo.
        pause
        exit /b 1
    )
    call :refreshpath
)

echo Starting AI Dev Suite TUI...
echo.
mix deps.get 2>nul
mix run
exit /b %ERRORLEVEL%

:refreshpath
set "Path=%ProgramData%\chocolatey\bin;%Path%"
goto :eof
