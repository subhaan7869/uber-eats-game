export interface Location {
  latitude: number;
  longitude: number;
}

export interface Order {
  id: string;
  restaurantName: string;
  restaurantLocation: Location;
  customerLocation: Location;
  estimatedPay: number;
  estimatedDistance: number; // in miles
  estimatedTime: number; // in mins
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  customerName: string;
  items: string[];
  pin?: string;
  // Indicates how this order was assigned to you
  // 'smart' = advanced matching, 'normal' = simple nearby trip
  matchingType?: 'smart' | 'normal';
  // Type of order for special features
  orderType?: 'Standard' | 'Smart Match' | 'Premium' | 'Urgent' | 'Bonus';
  // Surge pricing and boost information
  surgeMultiplier?: number; // e.g., 1.5 for 50% surge
  boostAmount?: number; // Additional boost amount in £
  restaurantWaitTime?: number; // Estimated wait time in minutes
}

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: 'driver' | 'customer';
  text: string;
  timestamp: number;
}

export interface DriverRating {
  id: string;
  orderId: string;
  rating: number; // 1-5 stars
  feedback?: string;
  timestamp: number;
  customerName: string;
  categories: {
    communication: number;
    navigation: number;
    professionalism: number;
    speed: number;
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  target: number;
  current: number;
  reward: number;
  icon: string;
  completed: boolean;
  expiresAt?: number;
}

export type AppScreen = 'onboarding' | 'documents' | 'face_verification' | 'email_verification' | 'home' | 'earnings' | 'inbox' | 'account' | 'chat' | 'uber_pro' | 'wallet' | 'opportunities' | 'safety' | 'earnings_detail' | 'banking' | 'heatmap' | 'referrals' | 'vehicles' | 'scheduled' | 'fuel' | 'emergency' | 'analytics' | 'promotions' | 'qr_scanner';

export type UberProTier = 'Blue' | 'Gold' | 'Platinum' | 'Diamond';

export interface UserProfile {
  name: string;
  rating: number;
  tier: UberProTier;
  points: number;
  deliveries: number;
  isOnline: boolean;
  documentsUploaded: boolean;
  faceVerified: boolean;
  // Email verification for "new device" sign-ins
  email: string;
  emailVerifiedDeviceId?: string;
  profilePic?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: 'car' | 'bike' | 'scooter' | 'van';
  isPrimary: boolean;
  insuranceExpiry?: number;
  registrationExpiry?: number;
}

export interface Referral {
  id: string;
  referredDriverName: string;
  referredDriverEmail: string;
  status: 'pending' | 'completed' | 'expired';
  bonusAmount: number;
  completedDate?: number;
  expiryDate: number;
}

export interface ScheduledBlock {
  id: string;
  startTime: number;
  endTime: number;
  guaranteedEarnings: number;
  location: string;
  status: 'available' | 'booked' | 'completed' | 'expired';
  actualEarnings?: number;
}

export interface FuelRecord {
  id: string;
  date: number;
  amount: number;
  pricePerGallon: number;
  totalCost: number;
  odometer: number;
  vehicleId: string;
  location?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'bonus' | 'guarantee' | 'multiplier' | 'quest';
  value: number;
  requirements: string;
  startDate: number;
  endDate: number;
  status: 'active' | 'completed' | 'expired';
  progress?: number;
  maxProgress?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: 'deliveries' | 'earnings' | 'ratings' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AISuggestion {
  id: string;
  type: 'route_optimization' | 'timing' | 'earnings' | 'rest' | 'location';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  potentialSavings?: number;
  estimatedTime?: number;
  confidence: number;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  likes: number;
  comments: number;
  isLiked: boolean;
  tags: string[];
}

export interface TrafficIncident {
  id: string;
  type: 'accident' | 'construction' | 'closure' | 'heavy_traffic';
  severity: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
    description: string;
  };
  estimatedDelay: number;
  alternateRoute?: string;
  timestamp: number;
}

export interface DocumentStatus {
  type: 'driving_licence' | 'insurance' | 'registration' | 'background_check';
  expiryDate: number;
  status: 'valid' | 'expiring_soon' | 'expired' | 'suspended';
  daysUntilExpiry: number;
  renewalRequired: boolean;
  lastReminder?: number;
}

export interface FinancialPressure {
  weeklyExpenses: number;
  vehicleMaintenance: number;
  insurancePayment: number;
  fuelCosts: number;
  phoneBill: number;
  weeklyTarget: number;
  currentWeekProgress: number;
  debtAmount: number;
  missedWeeklyTargets: number;
}

export interface RankDecay {
  currentRank: UberProTier;
  points: number;
  lastActivityDate: number;
  decayRate: number;
  warningLevel: 'none' | 'warning' | 'critical' | 'demotion_imminent';
  daysUntilDemotion: number;
  performanceScore: number;
}

export interface OfflineNotification {
  id: string;
  type: 'surge_alert' | 'quest_expire_warning' | 'rank_decay_warning' | 'document_expiry' | 'missed_opportunity';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  isRead: boolean;
  actionable: boolean;
  actionUrl?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  sessionId: string;
  expiresAt: number;
  isVerified: boolean;
  verificationMethod: 'email' | 'sms';
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
  timestamp: number;
  attempts: number;
}

export interface SMSVerificationRequest {
  phoneNumber: string;
  code: string;
  timestamp: number;
  attempts: number;
}

export interface CloudAuthResponse {
  success: boolean;
  userId?: string;
  sessionId?: string;
  error?: string;
  requiresVerification?: boolean;
  verificationMethod?: 'email' | 'sms';
}
