# Uber Eats Driver Authentication Server

Real email and SMS verification server for the Uber Eats Driver Simulation.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your email/SMS service credentials.

### 3. Start Server
```bash
npm start
# or for development:
npm run dev
```

Server will run on `http://localhost:3001`

## 📧 Email Service Options

### Option 1: Gmail (Easy for Development)
1. Enable 2FA on your Gmail account
2. Create an App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```env
EMAIL_SERVICE=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

### Option 2: SendGrid (Production)
1. Sign up for SendGrid: https://sendgrid.com
2. Get API Key
3. Add to `.env`:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

### Option 3: Mailtrap (Testing)
1. Sign up for Mailtrap: https://mailtrap.io
2. Get SMTP credentials
3. Add to `.env`:
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

## 📱 SMS Service Setup (Twilio)

### 1. Create Twilio Account
1. Sign up: https://twilio.com
2. Get Account SID and Auth Token
3. Get a Twilio phone number

### 2. Configure
Add to `.env`:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🧪 Testing the Server

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Test Email
```bash
curl -X POST http://localhost:3001/api/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Test SMS
```bash
curl -X POST http://localhost:3001/api/send-verification-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","code":"123456"}'
```

## 🔗 API Endpoints

### Send Verification Email
```
POST /api/send-verification-email
{
  "email": "user@example.com",
  "code": "123456",
  "subject": "Custom Subject (optional)",
  "message": "Custom message (optional)"
}
```

### Send Verification SMS
```
POST /api/send-verification-sms
{
  "phoneNumber": "+1234567890",
  "code": "123456",
  "message": "Custom message (optional)"
}
```

### Health Check
```
GET /api/health
```

## 🎯 Integration with Frontend

The frontend automatically uses these endpoints when available. Make sure the server is running before testing authentication.

## 🛠️ Troubleshooting

### Gmail Issues
- Make sure 2FA is enabled
- Use App Password, not regular password
- Check Gmail SMTP settings

### Twilio Issues
- Verify Account SID and Auth Token
- Ensure phone number is verified
- Check Twilio console for errors

### General Issues
- Check server logs for detailed errors
- Verify environment variables are loaded
- Test with health check endpoint first

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use environment variables for all credentials
- Enable CORS only for development
- Use HTTPS in production

## 📝 License

MIT
