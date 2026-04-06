const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email Service Configuration
let emailTransporter;

// Initialize Email Service
async function initializeEmailService() {
  try {
    // Option 1: Gmail (for development)
    if (process.env.EMAIL_SERVICE === 'gmail') {
      emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }
    // Option 2: SendGrid (production)
    else if (process.env.EMAIL_SERVICE === 'sendgrid') {
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
    // Option 3: AWS SES (production)
    else if (process.env.EMAIL_SERVICE === 'ses') {
      emailTransporter = nodemailer.createTransport({
        host: process.env.AWS_SES_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_SES_USER,
          pass: process.env.AWS_SES_PASSWORD
        }
      });
    }
    // Option 4: Development SMTP (Mailtrap, etc.)
    else if (process.env.EMAIL_SERVICE === 'smtp') {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
    
    console.log('✅ Email service initialized:', process.env.EMAIL_SERVICE || 'smtp');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    return false;
  }
}

// SMS Service Configuration
let twilioClient;

async function initializeSMSService() {
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('✅ Twilio SMS service initialized');
      return true;
    } else {
      console.log('⚠️  Twilio credentials not found - SMS disabled');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize SMS service:', error.message);
    return false;
  }
}

// Email Verification Endpoint
app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email, code, subject, message } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and code are required' 
      });
    }

    // Initialize email service if not already done
    if (!emailTransporter) {
      const initialized = await initializeEmailService();
      if (!initialized) {
        return res.status(500).json({ 
          success: false, 
          error: 'Email service not available' 
        });
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@uber-eats-driver.com',
      to: email,
      subject: subject || 'Uber Eats Driver - Email Verification',
      text: message || `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this verification, please ignore this email.\n\nThanks,\nUber Eats Driver Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #000000; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">UBER EATS DRIVER</h1>
            <p style="color: #ffffff; margin: 5px 0 0;">Email Verification</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #000000; font-size: 20px; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">Hello!</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="color: #333333; font-size: 14px; margin: 0 0 10px;">Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 3px; font-family: monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.5;">
              This code expires in 10 minutes.<br>
              If you didn't request this verification, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">Thanks,<br>Uber Eats Driver Team</p>
            </div>
          </div>
        </div>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email: ' + error.message 
    });
  }
});

// SMS Verification Endpoint
app.post('/api/send-verification-sms', async (req, res) => {
  try {
    const { phoneNumber, code, message } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and code are required' 
      });
    }

    // Initialize SMS service if not already done
    if (!twilioClient) {
      const initialized = await initializeSMSService();
      if (!initialized) {
        return res.status(500).json({ 
          success: false, 
          error: 'SMS service not available' 
        });
      }
    }

    const smsText = message || `Uber Eats Driver: Your verification code is ${code}. Expires in 10 min.`;
    
    const smsOptions = {
      body: smsText,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    };

    const smsResult = await twilioClient.messages.create(smsOptions);
    console.log('✅ SMS sent successfully:', smsResult.sid);
    
    res.json({ 
      success: true, 
      messageId: smsResult.sid,
      message: 'Verification SMS sent successfully'
    });

  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS: ' + error.message 
    });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      email: !!emailTransporter,
      sms: !!twilioClient
    }
  });
});

// Test Endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Uber Eats Driver Auth Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start Server
async function startServer() {
  try {
    // Initialize services
    await initializeEmailService();
    await initializeSMSService();
    
    app.listen(PORT, () => {
      console.log(`🚀 Uber Eats Driver Auth Server running on port ${PORT}`);
      console.log(`📧 Email Service: ${emailTransporter ? '✅ Active' : '❌ Inactive'}`);
      console.log(`📱 SMS Service: ${twilioClient ? '✅ Active' : '❌ Inactive'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

startServer();
