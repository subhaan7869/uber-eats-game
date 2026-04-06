// Cloud Storage Service for Uber Eats Driver Simulation

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
