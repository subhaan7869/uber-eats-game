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
}

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: 'driver' | 'customer';
  text: string;
  timestamp: number;
}

export type AppScreen = 'onboarding' | 'documents' | 'face_verification' | 'email_verification' | 'home' | 'earnings' | 'inbox' | 'account' | 'chat' | 'uber_pro' | 'wallet' | 'opportunities' | 'safety' | 'earnings_detail' | 'banking';

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
