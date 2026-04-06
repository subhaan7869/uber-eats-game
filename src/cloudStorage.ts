// Cloud Storage Service for Uber Eats Driver Simulation

import { UserCredentials, AuthSession, EmailVerificationRequest, SMSVerificationRequest, CloudAuthResponse } from './types';

export interface CloudProfile {
  name: string;
  rating: number;
  tier: 'Blue' | 'Gold' | 'Platinum' | 'Diamond';
  points: number;
  deliveries: number;
  isOnline: boolean;
  documentsUploaded: boolean;
  faceVerified: boolean;
  email: string;
  emailVerifiedDeviceId?: string;
  profilePic?: string;
  earnings: number;
  bankBalance: number;
  purchasedItems: string[];
  totalDistance: number;
  totalTime: number;
  achievements: string[];
  lastSaved: number;
}

export interface CloudSaveData {
  profile: CloudProfile;
  activeOrders: any[];
  statistics: {
    totalEarnings: number;
    totalDeliveries: number;
    averageRating: number;
    totalHours: number;
    favoriteRestaurants: string[];
    peakHours: number[];
  };
}

class CloudStorageService {
  private readonly STORAGE_KEY = 'uber_cloud_profile';
  private readonly BACKUP_KEY = 'uber_cloud_backup';
  private readonly API_ENDPOINT = import.meta.env.VITE_CLOUD_API_URL || null;
  private readonly AUTH_ENDPOINT = import.meta.env.VITE_CLOUD_AUTH_URL || null;

  // Generate verification code
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send real email verification
  async sendEmailVerification(email: string): Promise<boolean> {
    const code = this.generateVerificationCode();
    
    // Store verification request locally for demo
    const verificationRequest: EmailVerificationRequest = {
      email,
      code,
      timestamp: Date.now(),
      attempts: 0
    };
    localStorage.setItem('email_verification', JSON.stringify(verificationRequest));

    try {
      // Simulate real email service (in production, this would call your email API)
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          subject: 'Uber Eats Driver - Email Verification',
          message: `Your verification code is: ${code}. This code expires in 10 minutes.`
        })
      });

      if (response.ok) {
        console.log(`Verification email sent to ${email} with code ${code}`);
        return true;
      }
    } catch (error) {
      console.log('Email service not available, using fallback');
      // Fallback: create a simple email client simulation
      this.createEmailClientSimulation(email, code);
      return true;
    }

    return false;
  }

  // Send SMS verification
  async sendSMSVerification(phoneNumber: string): Promise<boolean> {
    const code = this.generateVerificationCode();
    
    // Store verification request locally for demo
    const verificationRequest: SMSVerificationRequest = {
      phoneNumber,
      code,
      timestamp: Date.now(),
      attempts: 0
    };
    localStorage.setItem('sms_verification', JSON.stringify(verificationRequest));

    try {
      // Simulate real SMS service (in production, this would call Twilio/SMS API)
      const response = await fetch('/api/send-verification-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          code,
          message: `Uber Eats Driver: Your verification code is ${code}. Expires in 10 min.`
        })
      });

      if (response.ok) {
        console.log(`SMS sent to ${phoneNumber} with code ${code}`);
        return true;
      }
    } catch (error) {
      console.log('SMS service not available, using fallback');
      // Fallback: show SMS simulation
      this.createSMSSimulation(phoneNumber, code);
      return true;
    }

    return false;
  }

  // Email client simulation (for demo purposes)
  private createEmailClientSimulation(email: string, code: string) {
    // Create a modal or alert showing the "email" that was sent
    const emailContent = `
========================================
UBER EATS DRIVER - VERIFICATION EMAIL
========================================
To: ${email}
Subject: Verify Your Email Address

Hello!

Your verification code is: ${code}

This code expires in 10 minutes.

If you didn't request this verification, please ignore this email.

Thanks,
Uber Eats Driver Team
========================================
    `;
    
    console.log('📧 EMAIL SENT (Simulation):');
    console.log(emailContent);
    
    // Store for display in verification UI
    localStorage.setItem('last_email_sent', JSON.stringify({
      email,
      code,
      content: emailContent,
      timestamp: Date.now()
    }));
  }

  // SMS simulation (for demo purposes)
  private createSMSSimulation(phoneNumber: string, code: string) {
    const smsContent = `
========================================
SMS MESSAGE
========================================
To: ${phoneNumber}
From: Uber Eats Driver

Your verification code is: ${code}
Expires in 10 minutes.
========================================
    `;
    
    console.log('📱 SMS SENT (Simulation):');
    console.log(smsContent);
    
    // Store for display in verification UI
    localStorage.setItem('last_sms_sent', JSON.stringify({
      phoneNumber,
      code,
      content: smsContent,
      timestamp: Date.now()
    }));
  }

  // Verify email code
  async verifyEmailCode(email: string, code: string): Promise<CloudAuthResponse> {
    const stored = localStorage.getItem('email_verification');
    if (!stored) {
      return { success: false, error: 'No verification request found' };
    }

    const verification: EmailVerificationRequest = JSON.parse(stored);
    
    // Check expiry (10 minutes)
    if (Date.now() - verification.timestamp > 10 * 60 * 1000) {
      localStorage.removeItem('email_verification');
      return { success: false, error: 'Verification code expired' };
    }

    // Check attempts (max 3)
    if (verification.attempts >= 3) {
      localStorage.removeItem('email_verification');
      return { success: false, error: 'Too many verification attempts' };
    }

    // Update attempts
    verification.attempts++;
    localStorage.setItem('email_verification', JSON.stringify(verification));

    // Verify code
    if (verification.email === email && verification.code === code) {
      localStorage.removeItem('email_verification');
      
      // Create session
      const sessionId = this.generateSessionId();
      const userId = this.generateUserId();
      
      const session: AuthSession = {
        userId,
        email,
        sessionId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        isVerified: true,
        verificationMethod: 'email'
      };
      
      localStorage.setItem('auth_session', JSON.stringify(session));
      
      return { 
        success: true, 
        userId, 
        sessionId,
        requiresVerification: false 
      };
    }

    return { success: false, error: 'Invalid verification code' };
  }

  // Verify SMS code
  async verifySMSCode(phoneNumber: string, code: string): Promise<CloudAuthResponse> {
    const stored = localStorage.getItem('sms_verification');
    if (!stored) {
      return { success: false, error: 'No verification request found' };
    }

    const verification: SMSVerificationRequest = JSON.parse(stored);
    
    // Check expiry (10 minutes)
    if (Date.now() - verification.timestamp > 10 * 60 * 1000) {
      localStorage.removeItem('sms_verification');
      return { success: false, error: 'Verification code expired' };
    }

    // Check attempts (max 3)
    if (verification.attempts >= 3) {
      localStorage.removeItem('sms_verification');
      return { success: false, error: 'Too many verification attempts' };
    }

    // Update attempts
    verification.attempts++;
    localStorage.setItem('sms_verification', JSON.stringify(verification));

    // Verify code
    if (verification.phoneNumber === phoneNumber && verification.code === code) {
      localStorage.removeItem('sms_verification');
      
      // Create session
      const sessionId = this.generateSessionId();
      const userId = this.generateUserId();
      
      const session: AuthSession = {
        userId,
        email: phoneNumber + '@uber.driver', // Placeholder email
        sessionId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        isVerified: true,
        verificationMethod: 'sms'
      };
      
      localStorage.setItem('auth_session', JSON.stringify(session));
      
      return { 
        success: true, 
        userId, 
        sessionId,
        requiresVerification: false 
      };
    }

    return { success: false, error: 'Invalid verification code' };
  }

  // Register new user
  async registerUser(credentials: UserCredentials): Promise<CloudAuthResponse> {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      if (existingUsers.find((u: any) => u.email === credentials.email)) {
        return { success: false, error: 'Email already registered' };
      }

      // Create new user
      const newUser = {
        id: this.generateUserId(),
        email: credentials.email,
        password: this.hashPassword(credentials.password),
        phoneNumber: credentials.phoneNumber,
        createdAt: Date.now(),
        isVerified: false
      };

      existingUsers.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(existingUsers));

      // Send verification
      await this.sendEmailVerification(credentials.email);

      return {
        success: true,
        requiresVerification: true,
        verificationMethod: 'email'
      };

    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }

  // Login user
  async loginUser(credentials: UserCredentials): Promise<CloudAuthResponse> {
    try {
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const user = users.find((u: any) => u.email === credentials.email);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!this.verifyPassword(credentials.password, user.password)) {
        return { success: false, error: 'Invalid password' };
      }

      if (!user.isVerified) {
        // Resend verification
        await this.sendEmailVerification(credentials.email);
        return {
          success: true,
          requiresVerification: true,
          verificationMethod: 'email'
        };
      }

      // Create session
      const sessionId = this.generateSessionId();
      const session: AuthSession = {
        userId: user.id,
        email: user.email,
        sessionId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
        isVerified: true,
        verificationMethod: 'email'
      };
      
      localStorage.setItem('auth_session', JSON.stringify(session));

      return { 
        success: true, 
        userId: user.id, 
        sessionId,
        requiresVerification: false 
      };

    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  // Get current session
  getCurrentSession(): AuthSession | null {
    const stored = localStorage.getItem('auth_session');
    if (!stored) return null;

    const session: AuthSession = JSON.parse(stored);
    
    // Check expiry
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('auth_session');
      return null;
    }

    return session;
  }

  // Logout
  logout(): void {
    localStorage.removeItem('auth_session');
  }

  // Helper methods
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private hashPassword(password: string): string {
    // Simple hash for demo (use bcrypt in production)
    return btoa(password + '_salt_' + Date.now());
  }

  private verifyPassword(password: string, hash: string): boolean {
    try {
      return btoa(password + '_salt_') === hash.split('_salt_')[0] + '_salt_' + hash.split('_salt_')[1];
    } catch {
      return false;
    }
  }

  // Save profile to cloud (or localStorage as fallback)
  async saveProfile(profile: Partial<CloudProfile>): Promise<boolean> {
    try {
      const cloudData: CloudProfile = {
        ...profile,
        lastSaved: Date.now(),
      } as CloudProfile;

      // Try cloud API first if configured
      if (this.API_ENDPOINT) {
        const response = await fetch(`${this.API_ENDPOINT}/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cloudData),
        });

        if (response.ok) {
          // Also save locally as backup
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cloudData));
          this.createBackup(cloudData);
          return true;
        }
      }

      // Fallback to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cloudData));
      this.createBackup(cloudData);
      
      // Simulate cloud sync with delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Error saving profile to cloud:', error);
      // Always save locally as backup
      try {
        const cloudData = { ...profile, lastSaved: Date.now() } as CloudProfile;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cloudData));
        this.createBackup(cloudData);
        return true;
      } catch (backupError) {
        console.error('Error saving local backup:', backupError);
        return false;
      }
    }
  }

  // Load profile from cloud (or localStorage as fallback)
  async loadProfile(): Promise<CloudProfile | null> {
    try {
      // Try cloud API first if configured
      if (this.API_ENDPOINT) {
        const response = await fetch(`${this.API_ENDPOINT}/profile`);
        if (response.ok) {
          const cloudData = await response.json();
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cloudData));
          return cloudData;
        }
      }

      // Fallback to localStorage
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (localData) {
        const profile = JSON.parse(localData);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error loading profile from cloud:', error);
      
      // Try to load from backup
      try {
        const backupData = localStorage.getItem(this.BACKUP_KEY);
        if (backupData) {
          const backup = JSON.parse(backupData);
          console.log('Loaded profile from backup');
          return backup;
        }
      } catch (backupError) {
        console.error('Error loading backup:', backupError);
      }
      
      return null;
    }
  }

  // Create backup of current profile
  private createBackup(profile: CloudProfile): void {
    try {
      const backups = JSON.parse(localStorage.getItem('uber_cloud_backups') || '[]');
      backups.push({
        ...profile,
        backupTime: Date.now(),
      });
      
      // Keep only last 5 backups
      if (backups.length > 5) {
        backups.shift();
      }
      
      localStorage.setItem('uber_cloud_backups', JSON.stringify(backups));
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  // Get available backups
  getBackups(): Array<CloudProfile & { backupTime: number }> {
    try {
      return JSON.parse(localStorage.getItem('uber_cloud_backups') || '[]');
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  // Restore from backup
  async restoreFromBackup(backupTime: number): Promise<boolean> {
    try {
      const backups = this.getBackups();
      const backup = backups.find(b => b.backupTime === backupTime);
      
      if (backup) {
        return await this.saveProfile(backup);
      }
      return false;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  // Delete profile from cloud
  async deleteProfile(): Promise<boolean> {
    try {
      if (this.API_ENDPOINT) {
        const response = await fetch(`${this.API_ENDPOINT}/profile`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete from cloud');
        }
      }

      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.BACKUP_KEY);
      localStorage.removeItem('uber_cloud_backups');
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  // Check if cloud sync is available
  isCloudSyncAvailable(): boolean {
    return !!this.API_ENDPOINT;
  }

  // Get sync status
  getSyncStatus(): {
    lastSync: number | null;
    isOnline: boolean;
    hasCloudData: boolean;
    hasLocalData: boolean;
  } {
    const localData = localStorage.getItem(this.STORAGE_KEY);
    let lastSync = null;
    let hasCloudData = false;

    if (localData) {
      try {
        const profile = JSON.parse(localData);
        lastSync = profile.lastSaved || null;
      } catch (error) {
        console.error('Error parsing local data:', error);
      }
    }

    return {
      lastSync,
      isOnline: navigator.onLine,
      hasCloudData: this.isCloudSyncAvailable(),
      hasLocalData: !!localData,
    };
  }
}

export const cloudStorage = new CloudStorageService();
