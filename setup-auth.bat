@echo off
echo 🚀 Setting up Uber Eats Driver Real Authentication
echo ================================================

REM Check if server directory exists
if not exist "server" (
    echo ❌ Server directory not found. Please run from project root.
    pause
    exit /b 1
)

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install

REM Copy environment file
if not exist ".env" (
    echo 📝 Creating environment file...
    copy .env.example .env >nul
    echo ✅ Created .env file from template
    echo.
    echo 🔧 IMPORTANT: Edit server\.env with your email/SMS credentials:
    echo    - For Gmail: Enable 2FA and create App Password
    echo    - For Twilio: Get Account SID and Auth Token
    echo    - Or use Mailtrap for testing (free)
    echo.
    echo 📧 Quick Gmail Setup:
    echo    1. Go to: https://myaccount.google.com/apppasswords
    echo    2. Create App Password
    echo    3. Add to .env: GMAIL_USER=your-email@gmail.com
    echo    4. Add to .env: GMAIL_APP_PASSWORD=your-16-digit-password
    echo.
) else (
    echo ✅ Environment file already exists
)

REM Start server
echo 🌐 Starting authentication server...
call npm start

pause
