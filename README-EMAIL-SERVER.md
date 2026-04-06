# Uber Eats Driver - Email Verification Server

This backend server enables real email sending for the Uber Eats Driver Simulation email verification feature.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install --production
# or
yarn install --production
```

### 2. Set Up Gmail Account

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" on "Select app" dropdown
   - Enter "Uber Eats Simulation" as the app name
   - Copy the 16-character password generated

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```env
# Gmail configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Environment
NODE_ENV=development
```

### 4. Start the Server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3001`

## 📧 API Endpoints

### Send Verification Code
```
POST /api/send-verification-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "userName": "John Doe",
  "deviceId": "device-uuid"
}
```

### Verify Code
```
POST /api/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

### Health Check
```
GET /api/health
```

## 🎨 Email Template Features

- **Professional Uber Eats branding**
- **Responsive design** for all devices
- **Security notices** and expiration warnings
- **Verification code** with large, readable font
- **Automatic fallback** to local verification if email fails

## 🔧 Configuration Options

### Gmail SMTP Settings (Default)
- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false` (TLS)

### Custom SMTP
You can modify `server.js` to use a different SMTP service:

```javascript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-server.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🛡️ Security Features

- **Code expiration**: 10 minutes
- **Rate limiting**: 30-second cooldown between sends
- **Input validation**: Email format and required fields
- **Error handling**: Graceful fallback to local verification
- **CORS enabled**: Cross-origin requests from frontend

## 📱 Frontend Integration

The frontend automatically detects the email server at:
- Primary: `VITE_CLOUD_SEND_EMAIL_CODE_URL` environment variable
- Fallback: `http://localhost:3001/api/send-verification-code`

## 🚨 Troubleshooting

### Gmail Authentication Issues
1. **Enable "Less secure apps"** (not recommended for production)
2. **Use App Passwords** instead of your regular password
3. **Check 2FA settings** are properly configured

### Common Errors
- `535-5.7.8 Username and Password not accepted`: Use App Password, not regular password
- `ETIMEDOUT`: Check firewall and internet connection
- `ECONNREFUSED`: Verify SMTP settings and port

### Development Mode
In development, the verification code is also returned in the API response for easy testing:

```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "devCode": "123456"  // Only in development
}
```

## 📊 Monitoring

The server logs:
- Email sending status
- Verification attempts
- Error details
- Health check responses

## 🔒 Production Considerations

1. **Use environment variables** for sensitive data
2. **Enable TLS/SSL** in production
3. **Set up proper CORS** for your domain
4. **Monitor email quotas** (Gmail limits)
5. **Consider Redis** for code storage in production

## 📧 Email Service Alternatives

Instead of Gmail, you can use:
- **SendGrid**: `@sendgrid/mail`
- **Mailgun**: `mailgun-js`
- **AWS SES**: `@aws-sdk/client-ses`
- **Postmark**: `postmark`

Just update the transporter configuration in `server.js`.

## 🎯 Next Steps

1. Start the email server: `npm run dev`
2. Start the frontend: `npm run dev` (in project root)
3. Test email verification in the app
4. Check your email inbox for the verification code!

The system will gracefully fallback to local verification if the email server is unavailable.
