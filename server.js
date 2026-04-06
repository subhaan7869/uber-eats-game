const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Email configuration
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'uber.eats.simulation@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password-here'
  }
});

// Store verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Generate email template
const getEmailTemplate = (code, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Uber Eats - Email Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #000000; color: white; padding: 30px 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px; }
        .code-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
        .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: 'Courier New', monospace; }
        .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; color: #6c757d; font-size: 14px; }
        .uber-logo { width: 120px; height: auto; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
        .button { display: inline-block; background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍔 Uber Eats Driver</h1>
        </div>
        
        <div class="content">
          <h2 style="color: #000000; margin-bottom: 10px;">Email Verification Required</h2>
          <p style="color: #6c757d; font-size: 16px; line-height: 1.5;">
            Hi ${userName || 'Driver'},<br><br>
            You're trying to sign in to your Uber Eats Driver account on a new device. 
            Please use the verification code below to continue:
          </p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <div class="security-note">
            <strong>🔒 Security Notice:</strong><br>
            This code will expire in 10 minutes. Never share this code with anyone. 
            If you didn't request this code, please ignore this email.
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            If you have any questions, contact our support team.
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 Uber Eats Driver Simulation. All rights reserved.</p>
          <p style="font-size: 12px; margin-top: 10px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send verification code endpoint
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiry (10 minutes)
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    // Clean up expired codes
    for (const [key, value] of verificationCodes.entries()) {
      if (Date.now() > value.expiresAt) {
        verificationCodes.delete(key);
      }
    }
    
    const mailOptions = {
      from: '"Uber Eats Driver" <uber.eats.simulation@gmail.com>',
      to: email,
      subject: 'Uber Eats Driver - Verification Code',
      html: getEmailTemplate(code, userName)
    };
    
    await transporter.sendMail(mailOptions);
    
    console.log(`Verification code sent to ${email}: ${code}`);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      // For development only - remove in production
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined 
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Verify code endpoint
app.post('/api/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }
    
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code has expired' });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Code is valid - remove it
    verificationCodes.delete(email);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
    
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    emailService: 'connected'
  });
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Uber Eats Email Server running on port ${PORT}`);
  console.log(`📧 Email service configured and ready`);
  console.log(`🌐 Frontend served at: http://localhost:${PORT}`);
  
  // Test email configuration on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error);
      console.log('💡 Please set up EMAIL_USER and EMAIL_PASS environment variables');
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
});
