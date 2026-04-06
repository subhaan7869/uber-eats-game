/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { 
  Navigation, 
  Menu, 
  Search, 
  TrendingUp, 
  Mail, 
  User, 
  MapPin, 
  Clock, 
  DollarSign, 
  ChevronUp, 
  X, 
  Check, 
  ArrowRight,
  Moon,
  ShieldCheck,
  Zap,
  Star,
  Coffee,
  Camera,
  FileText,
  CreditCard,
  Bell,
  MessageSquare,
  LogOut,
  HelpCircle,
  Briefcase,
  Gift,
  Settings,
  ChevronRight,
  Send,
  Phone,
  RefreshCw,
  Smartphone,
  ShieldAlert,
  Share2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Play,
  Square,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Globe,
  Heart,
  ShoppingBag,
  Truck,
  Bike,
  Car,
  Calendar,
  Users,
  Fuel,
  Activity,
  Award,
  QrCode,
  Map,
  Thermometer,
  Wind,
  Cloud,
  Gauge,
  Route,
  Navigation2,
  Timer,
  BarChart3,
  Target,
  ZapOff,
  PhoneCall,
  AlertTriangle,
  Flame,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Shared sleep function - outside any component
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
import { Location, Order, AppScreen, ChatMessage, UserProfile, UberProTier, DriverRating, Quest, Vehicle, Referral, ScheduledBlock, FuelRecord, Promotion, EmergencyContact, Achievement, AISuggestion, CommunityPost, TrafficIncident, DocumentStatus, FinancialPressure, RankDecay, OfflineNotification, UserCredentials, AuthSession } from './types';
import { cloudStorage, CloudProfile } from './cloudStorage';

// Optional cloud profile sync endpoint (configure in env if you want real cloud save)
const CLOUD_PROFILE_URL =
  (import.meta as any)?.env?.VITE_CLOUD_PROFILE_URL ||
  ((import.meta as any)?.env?.APP_URL
    ? `${(import.meta as any).env.APP_URL.replace(/\/$/, '')}/api/profile`
    : null);

// Optional cloud endpoint to "send" the email code (demo-style).
// If unset, we will simulate sending by showing the code in the UI/notification.
const CLOUD_SEND_EMAIL_CODE_URL = (import.meta as any)?.env?.VITE_CLOUD_SEND_EMAIL_CODE_URL || null;

// Mock data for nearby restaurants (UK names)
const MOCK_RESTAURANTS = [
  { name: "Greggs", offset: { lat: 0.002, lng: 0.002 } },
  { name: "Costa Coffee", offset: { lat: -0.001, lng: 0.003 } },
  { name: "Nando's", offset: { lat: 0.003, lng: -0.001 } },
  { name: "Wagamama", offset: { lat: -0.002, lng: -0.002 } },
  { name: "Local Chippy", offset: { lat: 0.001, lng: -0.003 } },
  { name: "McDonald's", offset: { lat: 0.004, lng: 0.004 } },
  { name: "Starbucks", offset: { lat: -0.003, lng: 0.005 } },
  { name: "Burger King", offset: { lat: 0.005, lng: -0.002 } },
  { name: "Pizza Express", offset: { lat: -0.004, lng: -0.004 } },
  { name: "Subway", offset: { lat: 0.002, lng: -0.005 } },
  { name: "Five Guys", offset: { lat: -0.005, lng: 0.002 } },
  { name: "KFC", offset: { lat: 0.006, lng: 0.001 } },
  { name: "Pret A Manger", offset: { lat: -0.002, lng: 0.006 } },
  { name: "Leon", offset: { lat: 0.003, lng: 0.007 } },
  { name: "Itsu", offset: { lat: -0.006, lng: -0.001 } },
  { name: "Wasabi", offset: { lat: 0.001, lng: -0.007 } },
  { name: "Zizzi", offset: { lat: -0.007, lng: 0.003 } },
  { name: "Ask Italian", offset: { lat: 0.004, lng: -0.006 } },
  { name: "Taco Bell", offset: { lat: -0.001, lng: -0.008 } },
  { name: "Shake Shack", offset: { lat: 0.008, lng: 0.001 } },
];

const MOCK_CUSTOMERS = ["James", "Sophie", "Oliver", "Emily", "Jack", "Chloe"];

export default function App() {
  // App State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('uber_theme') as 'light' | 'dark') || 'light';
  });
  const [earningsTab, setEarningsTab] = useState<'today' | 'weekly' | 'recent'>('today');
  
  // --- Cloud profile helpers ---
  const loadUserProfileFromCloud = async (): Promise<Partial<UserProfile> | null> => {
    try {
      const cloudProfile = await cloudStorage.loadProfile();
      if (cloudProfile) {
        return {
          name: cloudProfile.name,
          rating: cloudProfile.rating,
          tier: cloudProfile.tier,
          points: cloudProfile.points,
          deliveries: cloudProfile.deliveries,
          isOnline: cloudProfile.isOnline,
          documentsUploaded: cloudProfile.documentsUploaded,
          faceVerified: cloudProfile.faceVerified,
          email: cloudProfile.email,
          emailVerifiedDeviceId: cloudProfile.emailVerifiedDeviceId,
          profilePic: cloudProfile.profilePic,
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading cloud profile:', error);
      return null;
    }
  };

  const saveUserProfileToCloud = async (profile: UserProfile) => {
    try {
      const cloudProfile: CloudProfile = {
        ...profile,
        earnings,
        bankBalance,
        purchasedItems,
        totalDistance: activeOrders.reduce((sum, order) => sum + order.estimatedDistance, 0),
        totalTime: activeOrders.reduce((sum, order) => sum + order.estimatedTime, 0),
        achievements: [], // TODO: Implement achievements
        lastSaved: Date.now(),
      };
      
      await cloudStorage.saveProfile(cloudProfile);
    } catch (error) {
      console.error('Error saving cloud profile:', error);
    }
  };

  // User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('uber_eats_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        isOnline: false, // Always start offline
        email: parsed.email || (parsed.name ? `${String(parsed.name).toLowerCase().replace(/\s+/g, '.')}@example.com` : 'driver@example.com'),
      };
    }
    return {
      name: "Hassen Nabeel",
      rating: 4.95,
      tier: 'Blue',
      points: 120,
      deliveries: 8,
      isOnline: false,
      documentsUploaded: false,
      faceVerified: false,
      email: "driver@example.com",
    };
  });

  // Persist user profile (local + optional cloud)
  useEffect(() => {
    const toPersist = {
      ...user,
      isOnline: false, // Don't persist online status
    };
    localStorage.setItem('uber_eats_user', JSON.stringify(toPersist));
    // Fire-and-forget cloud save
    void saveUserProfileToCloud(toPersist);
  }, [user]);

  // On first load, try to hydrate from cloud profile
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const cloudProfile = await loadUserProfileFromCloud();
      if (cloudProfile && isMounted) {
        setUser(prev => ({
          ...prev,
          ...cloudProfile,
          email: (cloudProfile as any).email || prev.email,
          isOnline: false,
        }));
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Request notification permissions for background notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Request permission when user first interacts with the app
      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            sendNotification("Notifications Enabled", "You'll receive order notifications even when the app is in the background!");
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      };

      // Request permission on first user interaction (click/touch)
      const handleFirstInteraction = () => {
        requestPermission();
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };

      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    }
  }, []);

  // Device id for "new phone" detection (stored locally per device)
  const [deviceId] = useState(() => {
    const key = 'uber_device_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    // crypto.randomUUID is widely supported; fallback for older browsers
    const created =
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(key, created);
    return created;
  });

  const isEmailVerifiedForThisDevice = Boolean(
    user.email &&
      user.emailVerifiedDeviceId &&
      user.emailVerifiedDeviceId === deviceId
  );

  const emailVerificationRequired = Boolean(
    user.documentsUploaded &&
      user.faceVerified &&
      user.email &&
      !isEmailVerifiedForThisDevice
  );

  // Skip onboarding if already done (and route to email verification if needed)
  useEffect(() => {
    if (currentScreen !== 'onboarding') return;
    if (!user.documentsUploaded || !user.faceVerified) return;

    if (emailVerificationRequired) setCurrentScreen('email_verification');
    else setCurrentScreen('home');
  }, [currentScreen, user.documentsUploaded, user.faceVerified, emailVerificationRequired]);


  // Location & Orders
  const [location, setLocation] = useState<Location | null>({ latitude: 51.5074, longitude: -0.1278 }); // Default to London
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [earnings, setEarnings] = useState(() => {
    const saved = localStorage.getItem('uber_earnings');
    return saved ? parseFloat(saved) : 124.50;
  });
  const [bankBalance, setBankBalance] = useState(() => {
    const saved = localStorage.getItem('uber_bank_balance');
    return saved ? parseFloat(saved) : 500.00;
  });
  const [purchasedItems, setPurchasedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('uber_purchased_items');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist theme and earnings
  useEffect(() => {
    localStorage.setItem('uber_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('uber_earnings', earnings.toString());
  }, [earnings]);

  useEffect(() => {
    localStorage.setItem('uber_bank_balance', bankBalance.toString());
  }, [bankBalance]);

  // Auto cash out any remaining earnings once per day (at or after "midnight")
  useEffect(() => {
    const AUTO_KEY = 'uber_last_auto_cash_date';

    const performAutoCashOutIfNeeded = () => {
      if (earnings <= 0) return;

      const today = new Date().toDateString();
      const last = localStorage.getItem(AUTO_KEY);
      if (last === today) return;

      // Treat "now" as after midnight for auto cash; move to wallet
      setBankBalance(prev => prev + earnings);
      setEarnings(0);
      localStorage.setItem(AUTO_KEY, today);
      sendNotification("Daily Cash Out", "Your remaining balance has been moved to your wallet.");
    };

    // Check immediately on load (handles app being closed overnight)
    performAutoCashOutIfNeeded();

    // Then check periodically while app is open
    const interval = setInterval(performAutoCashOutIfNeeded, 60_000);
    return () => clearInterval(interval);
  }, [earnings]);

  useEffect(() => {
    localStorage.setItem('uber_purchased_items', JSON.stringify(purchasedItems));
  }, [purchasedItems]);
  
  // Chat & Notifications
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [verifyingDeliveryId, setVerifyingDeliveryId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
  const [orderExpiryTimer, setOrderExpiryTimer] = useState<number>(10);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [customerTimers, setCustomerTimers] = useState<Record<string, number>>({});
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [driverRatings, setDriverRatings] = useState<DriverRating[]>([]);
  const [quests, setQuests] = useState<Quest[]>(() => {
    // Initialize with some default quests
    const now = Date.now();
    return [
      {
        id: 'daily-deliveries',
        title: 'Daily Deliveries',
        description: 'Complete 10 deliveries today',
        type: 'daily',
        target: 10,
        current: 0,
        reward: 15,
        icon: '📦',
        completed: false,
        expiresAt: now + (24 * 60 * 60 * 1000)
      },
      {
        id: 'weekly-earnings',
        title: 'Weekly Earnings',
        description: 'Earn £200 this week',
        type: 'weekly',
        target: 200,
        current: 0,
        reward: 25,
        icon: '💰',
        completed: false,
        expiresAt: now + (7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'perfect-ratings',
        title: 'Perfect Ratings',
        description: 'Get 5 ratings of 4.5+ stars',
        type: 'weekly',
        target: 5,
        current: 0,
        reward: 20,
        icon: '⭐',
        completed: false,
        expiresAt: now + (7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'surge-hunter',
        title: 'Surge Hunter',
        description: 'Complete 5 deliveries during surge pricing',
        type: 'special',
        target: 5,
        current: 0,
        reward: 30,
        icon: '⚡',
        completed: false
      }
    ];
  });

  // Generate random rating after delivery completion
  const generateRating = (order: Order) => {
    setTimeout(() => {
      const rating = 3.5 + Math.random() * 1.5; //3.5-5.0 rating bias
      const newRating: DriverRating = {
        id: Math.random().toString(36).substr(2, 9),
        orderId: order.id,
        rating: Math.min(5, Math.max(1, rating)),
        feedback: [
          "Great delivery, very quick!",
          "Professional and friendly",
          "Food arrived hot and fresh",
          "Excellent communication",
          "Fast and efficient service",
          "Very satisfied with the service",
          "Would order again",
          "Perfect delivery experience"
        ][Math.floor(Math.random() * 8)],
        timestamp: Date.now(),
        customerName: order.customerName,
        categories: {
          communication: 4 + Math.random(),
          navigation: 4 + Math.random(),
          professionalism: 4 + Math.random(),
          speed: 4 + Math.random()
        }
      };
      
      setDriverRatings(prev => [newRating, ...prev]);
      
      // Update user rating (rolling average)
      const allRatings = [...driverRatings, newRating];
      const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      setUser(prev => ({ ...prev, rating: parseFloat(avgRating.toFixed(2)) }));
      
      // Show notification for good ratings
      if (newRating.rating >= 4.5) {
        sendNotification("Excellent Rating!", `You received ${newRating.rating.toFixed(1)} stars from ${order.customerName}`, 'normal');
        playUberSound('complete');
      }
      
      // Update quest progress
      updateQuestProgress('perfect-ratings', 1);
    }, 5000 + Math.random() * 10000); // 5-15 seconds after delivery
  };

  // Update quest progress
  const updateQuestProgress = (questId: string, increment: number) => {
    setQuests(prev => prev.map(quest => {
      if (quest.id === questId && !quest.completed) {
        const newCurrent = Math.min(quest.current + increment, quest.target);
        const isCompleted = newCurrent >= quest.target;
        
        if (isCompleted && !quest.completed) {
          // Award quest completion bonus
          setEarnings(e => e + quest.reward);
          sendNotification("Quest Completed!", `${quest.title} - £${quest.reward} bonus earned!`, 'high');
          playUberSound('bonus');
        }
        
        return { ...quest, current: newCurrent, completed: isCompleted };
      }
      return quest;
    }));
  };

  // --- Email verification (new device sign-ins) ---
  const [emailAddressInput, setEmailAddressInput] = useState<string>(user.email);
  const [emailCodeInput, setEmailCodeInput] = useState<string>('');
  const [emailSendCooldownUntil, setEmailSendCooldownUntil] = useState<number | null>(null);
  const [pendingEmailCode, setPendingEmailCode] = useState<string | null>(null);
  const [pendingEmailCodeExpiresAt, setPendingEmailCodeExpiresAt] = useState<number | null>(null);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  
  const [isBottomMenuOpen, setIsBottomMenuOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1.0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingToOnline, setIsVerifyingToOnline] = useState(false);

  // Responsive design system
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window === 'undefined') return { isMobile: false, isTablet: false, isDesktop: true, screenWidth: 1920, screenHeight: 1080 };
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Device detection based on screen size
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1
    };
  });

  // Update device info on window resize
  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo({
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
        isDesktop: window.innerWidth > 1024,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Responsive utility functions
  const getResponsiveValue = (mobile: any, tablet: any, desktop: any) => {
    if (deviceInfo.isMobile) return mobile;
    if (deviceInfo.isTablet) return tablet;
    if (deviceInfo.isDesktop) return desktop;
    return mobile; // fallback
  };

  const getResponsiveClass = (mobileClass: string, tabletClass: string, desktopClass: string) => {
    return getResponsiveValue(mobileClass, tabletClass, desktopClass);
  };

  const getResponsiveSize = () => {
    if (deviceInfo.isMobile) return 'mobile';
    if (deviceInfo.isTablet) return 'tablet';
    if (deviceInfo.isDesktop) return 'desktop';
    return 'desktop';
  };
  const [verifyTimeoutUntil, setVerifyTimeoutUntil] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<{ latitude: number, longitude: number, intensity: number, size: number }[]>([]);

  // New feature states
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      licensePlate: 'ABC-1234',
      type: 'car',
      isPrimary: true,
      insuranceExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000),
      registrationExpiry: Date.now() + (180 * 24 * 60 * 60 * 1000)
    }
  ]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      title: 'Weekend Bonus',
      description: 'Complete 15 deliveries this weekend for an extra £50',
      type: 'bonus',
      value: 50,
      requirements: '15 deliveries between Friday 6PM - Sunday 11PM',
      startDate: Date.now(),
      endDate: Date.now() + (3 * 24 * 60 * 60 * 1000),
      status: 'active',
      progress: 0,
      maxProgress: 15
    }
  ]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Emergency Services',
      phone: '999',
      relationship: 'Emergency',
      isPrimary: true
    }
  ]);
  const [weather, setWeather] = useState({
    temperature: 18,
    condition: 'partly_cloudy',
    windSpeed: 10,
    visibility: 'good'
  });
  const [isScanningQR, setIsScanningQR] = useState(false);

  // Innovative features state
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_delivery',
      title: 'First Delivery',
      description: 'Complete your first delivery',
      icon: '🎯',
      points: 10,
      progress: 1,
      maxProgress: 1,
      category: 'deliveries',
      rarity: 'common',
      unlockedAt: Date.now() - 86400000
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Complete 10 deliveries in under 30 minutes each',
      icon: '⚡',
      points: 50,
      progress: 7,
      maxProgress: 10,
      category: 'deliveries',
      rarity: 'rare'
    },
    {
      id: 'perfect_week',
      title: 'Perfect Week',
      description: 'Maintain 5.0 rating for 7 consecutive days',
      icon: '⭐',
      points: 100,
      progress: 5,
      maxProgress: 7,
      category: 'ratings',
      rarity: 'epic'
    }
  ]);
  
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([
    {
      id: '1',
      type: 'location',
      title: 'Move to City Center',
      description: 'High demand area detected 0.5 miles away. Potential earnings increase: £15-25/hour.',
      priority: 'high',
      potentialSavings: 20,
      confidence: 0.85,
      timestamp: Date.now() - 300000
    },
    {
      id: '2',
      type: 'timing',
      title: 'Peak Hours Starting Soon',
      description: 'Lunch rush begins in 15 minutes. Consider staying in current area for maximum orders.',
      priority: 'medium',
      estimatedTime: 15,
      confidence: 0.92,
      timestamp: Date.now() - 600000
    }
  ]);

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      authorName: 'Alex Chen',
      content: 'Just hit my 1000th delivery! The key is staying near business districts during lunch hours 🍕',
      timestamp: Date.now() - 3600000,
      likes: 24,
      comments: 8,
      isLiked: false,
      tags: ['milestone', 'tips']
    },
    {
      id: '2',
      authorName: 'Sarah Johnson',
      content: 'Pro tip: Always have a phone charger and cooling bag. Saved me today! 🔋❄️',
      timestamp: Date.now() - 7200000,
      likes: 45,
      comments: 12,
      isLiked: true,
      tags: ['tips', 'equipment']
    }
  ]);

  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([
    {
      id: '1',
      type: 'heavy_traffic',
      severity: 'medium',
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        description: 'Oxford Street'
      },
      estimatedDelay: 10,
      alternateRoute: 'Take Regent Street instead',
      timestamp: Date.now() - 900000
    }
  ]);

  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Realistic job features state
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([
    {
      type: 'driving_licence',
      expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      status: 'valid',
      daysUntilExpiry: 30,
      renewalRequired: false
    },
    {
      type: 'insurance',
      expiryDate: Date.now() + (45 * 24 * 60 * 60 * 1000),
      status: 'valid',
      daysUntilExpiry: 45,
      renewalRequired: false
    },
    {
      type: 'registration',
      expiryDate: Date.now() + (60 * 24 * 60 * 60 * 1000),
      status: 'valid',
      daysUntilExpiry: 60,
      renewalRequired: false
    },
    {
      type: 'background_check',
      expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
      status: 'valid',
      daysUntilExpiry: 365,
      renewalRequired: false
    }
  ]);

  const [financialPressure, setFinancialPressure] = useState<FinancialPressure>({
    weeklyExpenses: 250,
    vehicleMaintenance: 50,
    insurancePayment: 80,
    fuelCosts: 70,
    phoneBill: 30,
    weeklyTarget: 400,
    currentWeekProgress: 0,
    debtAmount: 0,
    missedWeeklyTargets: 0
  });

  const [rankDecay, setRankDecay] = useState<RankDecay>({
    currentRank: user.tier,
    points: user.points,
    lastActivityDate: Date.now(),
    decayRate: 5, // points lost per day of inactivity
    warningLevel: 'none',
    daysUntilDemotion: 30,
    performanceScore: 85
  });

  const [offlineNotifications, setOfflineNotifications] = useState<OfflineNotification[]>([]);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [consecutiveOfflineDays, setConsecutiveOfflineDays] = useState(0);

  // Authentication state
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<UserCredentials>({ email: '', password: '' });
  const [registerCredentials, setRegisterCredentials] = useState<UserCredentials>({ email: '', password: '', phoneNumber: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Realistic job consequences - Rank Decay System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const daysSinceLastActivity = Math.floor((now - rankDecay.lastActivityDate) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastActivity > 0 && !user.isOnline) {
        const pointsLost = daysSinceLastActivity * rankDecay.decayRate;
        const newPoints = Math.max(0, rankDecay.points - pointsLost);
        
        // Calculate new rank based on points
        let newRank: UberProTier = 'Blue';
        if (newPoints >= 1000) newRank = 'Diamond';
        else if (newPoints >= 600) newRank = 'Platinum';
        else if (newPoints >= 300) newRank = 'Gold';
        
        // Determine warning level
        let warningLevel: RankDecay['warningLevel'] = 'none';
        let daysUntilDemotion = 30;
        
        if (newRank === 'Diamond' && newPoints < 1000) {
          warningLevel = 'critical';
          daysUntilDemotion = 3;
        } else if (newRank === 'Platinum' && newPoints < 600) {
          warningLevel = 'warning';
          daysUntilDemotion = 7;
        } else if (newRank === 'Gold' && newPoints < 300) {
          warningLevel = 'demotion_imminent';
          daysUntilDemotion = 1;
        }
        
        setRankDecay(prev => ({
          ...prev,
          points: newPoints,
          currentRank: newRank,
          warningLevel,
          daysUntilDemotion,
          lastActivityDate: prev.lastActivityDate
        }));
        
        // Update user profile if rank changed
        if (newRank !== user.tier) {
          setUser(prev => ({ ...prev, tier: newRank, points: newPoints }));
          
          // Add offline notification for rank decay
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'rank_decay_warning',
            title: 'Rank Decay Alert',
            message: `Your rank has decayed to ${newRank} due to inactivity. Get back online to stop the decay!`,
            priority: warningLevel === 'critical' ? 'urgent' : 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user.isOnline, rankDecay.lastActivityDate, rankDecay.decayRate]);

  // Document Expiration System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedDocuments = documentStatuses.map(doc => {
        const daysUntilExpiry = Math.ceil((doc.expiryDate - now) / (24 * 60 * 60 * 1000));
        let status: DocumentStatus['status'] = doc.status;
        let renewalRequired = doc.renewalRequired;
        
        if (daysUntilExpiry <= 0) {
          status = 'expired';
          renewalRequired = true;
        } else if (daysUntilExpiry <= 7) {
          status = 'expiring_soon';
          renewalRequired = true;
        }
        
        return { ...doc, daysUntilExpiry, status, renewalRequired };
      });
      
      setDocumentStatuses(updatedDocuments);
      
      // Check for expired documents and prevent going online
      const hasExpiredDocs = updatedDocuments.some(doc => doc.status === 'expired');
      if (hasExpiredDocs && user.isOnline) {
        setUser(prev => ({ ...prev, isOnline: false }));
        sendNotification("Documents Expired", "You cannot go online with expired documents. Please renew them immediately.", 'high');
        
        const notification: OfflineNotification = {
          id: Math.random().toString(),
          type: 'document_expiry',
          title: 'Document Expired',
          message: 'Your documents have expired. You cannot work until they are renewed.',
          priority: 'urgent',
          timestamp: now,
          isRead: false,
          actionable: true,
          actionUrl: 'account'
        };
        setOfflineNotifications(prev => [notification, ...prev]);
      }
      
      // Send reminders for expiring documents
      updatedDocuments.forEach(doc => {
        if (doc.status === 'expiring_soon' && (!doc.lastReminder || now - doc.lastReminder > 24 * 60 * 60 * 1000)) {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'document_expiry',
            title: 'Document Expiring Soon',
            message: `Your ${doc.type.replace('_', ' ')} expires in ${doc.daysUntilExpiry} days.`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'account'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
          
          setDocumentStatuses(prev => prev.map(d => 
            d.type === doc.type ? { ...d, lastReminder: now } : d
          ));
        }
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Offline Notifications for Surges and Quests
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user.isOnline) {
        const now = Date.now();
        
        // Send surge alerts when offline
        if (currentSurge > 1.5 && Math.random() < 0.3) {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'surge_alert',
            title: '🔥 Surge Pricing Active!',
            message: `${currentSurge.toFixed(1)}x surge in ${currentCity}. You\'re missing out on higher earnings!`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Surge Pricing Active!', {
              body: `${currentSurge.toFixed(1)}x surge in ${currentCity}`,
              icon: '/favicon.ico',
              tag: `surge-${now}`,
              requireInteraction: true
            });
          }
        }
        
        // Send quest expiration warnings
        const expiringQuests = quests.filter(quest => 
          !quest.completed && 
          quest.expiresAt && 
          quest.expiresAt - now < 2 * 60 * 60 * 1000 && // Expires in less than 2 hours
          quest.expiresAt - now > 0 // Not already expired
        );
        
        expiringQuests.forEach(quest => {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'quest_expire_warning',
            title: '⏰ Quest Expiring Soon',
            message: `"${quest.title}" expires soon. Complete it to earn £${quest.reward}!`,
            priority: 'medium',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        });
        
        // Send missed opportunity notifications
        if (Math.random() < 0.1) {
          const missedEarnings = (Math.random() * 20 + 10).toFixed(2);
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'missed_opportunity',
            title: '💸 Missed Earnings',
            message: `You missed out on approximately £${missedEarnings} while offline.`,
            priority: 'low',
            timestamp: now,
            isRead: false,
            actionable: false
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user.isOnline, currentSurge, currentCity, quests]);

  // Financial Pressure System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dayOfWeek = new Date(now).getDay();
      const isStartOfWeek = dayOfWeek === 1; // Monday
      
      if (isStartOfWeek) {
        // Check if weekly target was met
        if (financialPressure.currentWeekProgress < financialPressure.weeklyTarget) {
          const shortfall = financialPressure.weeklyTarget - financialPressure.currentWeekProgress;
          const newDebt = financialPressure.debtAmount + shortfall;
          
          setFinancialPressure(prev => ({
            ...prev,
            debtAmount: newDebt,
            missedWeeklyTargets: prev.missedWeeklyTargets + 1,
            currentWeekProgress: 0
          }));
          
          // Send debt notification
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'missed_opportunity',
            title: '💳 Weekly Target Missed',
            message: `You missed your weekly target by £${shortfall.toFixed(2)}. Debt: £${newDebt.toFixed(2)}`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'earnings'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        } else {
          // Reset weekly progress
          setFinancialPressure(prev => ({
            ...prev,
            currentWeekProgress: 0
          }));
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [financialPressure.currentWeekProgress, financialPressure.weeklyTarget]);

  // Track online/offline status
  useEffect(() => {
    if (user.isOnline) {
      setLastOnlineTime(Date.now());
      setConsecutiveOfflineDays(0);
      setRankDecay(prev => ({ ...prev, lastActivityDate: Date.now() }));
    } else {
      const offlineDuration = Date.now() - lastOnlineTime;
      const offlineDays = Math.floor(offlineDuration / (24 * 60 * 60 * 1000));
      setConsecutiveOfflineDays(offlineDays);
    }
  }, [user.isOnline, lastOnlineTime]);

  // Generate random hotspots around driver
  useEffect(() => {
    if (location) {
      const generateHotspots = () => {
        const newHotspots = Array.from({ length: 8 }).map(() => ({
          latitude: location.latitude + (Math.random() - 0.5) * 0.03,
          longitude: location.longitude + (Math.random() - 0.5) * 0.03,
          intensity: 0.2 + Math.random() * 0.8,
          size: 100 + Math.random() * 300
        }));
        setHotspots(newHotspots as any);
      };
      
      generateHotspots();
      const interval = setInterval(generateHotspots, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [location === null]); // Only run once or when location is first set
  
  const currentCity = useMemo(() => {
    if (!location) return "London";
    const lat = location.latitude;
    const lng = location.longitude;
    
    // Proximity check for major UK cities
    if (lat > 53.3 && lat < 53.6 && lng > -2.4 && lng < -2.1) return "Manchester";
    if (lat > 52.3 && lat < 52.6 && lng > -2.0 && lng < -1.7) return "Birmingham";
    if (lat > 55.8 && lat < 56.0 && lng > -4.4 && lng < -4.1) return "Glasgow";
    if (lat > 53.7 && lat < 53.9 && lng > -1.7 && lng < -1.4) return "Leeds";
    if (lat > 51.4 && lat < 51.6 && lng > -2.7 && lng < -2.4) return "Bristol";
    if (lat > 51.3 && lat < 51.7 && lng > -0.5 && lng < 0.3) return "London";
    
    return "United Kingdom"; 
  }, [location]);

  const watchId = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const expiryInterval = useRef<NodeJS.Timeout | null>(null);

  // Order Expiry Timer
  useEffect(() => {
    if (pendingOrder && orderExpiryTimer > 0) {
      expiryInterval.current = setInterval(() => {
        setOrderExpiryTimer(prev => prev - 1);
      }, 1000);
    } else if (orderExpiryTimer === 0) {
      // If you ignored the request, force a quick face/pic verification.
      setPendingOrder(null);
      setOrderExpiryTimer(10);
      setIsVerifyingToOnline(true);
      setCurrentScreen('face_verification');
      // Give you a short window to complete verification before going offline
      setVerifyTimeoutUntil(Date.now() + 60_000); // 1 minute
    }

    return () => {
      if (expiryInterval.current) clearInterval(expiryInterval.current);
    };
  }, [pendingOrder, orderExpiryTimer]);

  // If you ignore the follow-up verification too, go offline automatically
  useEffect(() => {
    if (!verifyTimeoutUntil) return;
    const id = setInterval(() => {
      if (verifyTimeoutUntil && Date.now() >= verifyTimeoutUntil) {
        setVerifyTimeoutUntil(null);
        setIsVerifying(false);
        setIsVerifyingToOnline(false);
        setCurrentScreen('home');
        setUser(u => ({ ...u, isOnline: false, faceVerified: false }));
        sendNotification("Went Offline", "You were set offline after not responding to verification.");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [verifyTimeoutUntil]);

  const [isBackgrounded, setIsBackgrounded] = useState(false);

  // Surge pricing state
  const [currentSurge, setCurrentSurge] = useState(1.0);
  const [surgeAreas, setSurgeAreas] = useState<Array<{lat: number, lng: number, radius: number, multiplier: number}>>([]);

  // Earnings heatmap state
  const [earningsData, setEarningsData] = useState(() => {
    // Generate sample earnings data for the past week
    const data = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = dayStart + (hour * 60 * 60 * 1000);
        const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21);
        const isWeekend = i <= 1; // Last 2 days are weekend
        const baseEarnings = 5 + Math.random() * 10;
        const multiplier = isPeakHour ? (isWeekend ? 2.5 : 2.0) : (isWeekend ? 1.5 : 1.0);
        data.push({
          hour: hourStart,
          earnings: baseEarnings * multiplier,
          orders: Math.floor(1 + Math.random() * 4),
          day: i,
          hourOfDay: hour
        });
      }
    }
    return data;
  });

  // Calculate surge pricing based on time and demand
  const calculateSurgeMultiplier = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    let baseMultiplier = 1.0;
    
    // Peak hours: 7-9 AM, 12-2 PM, 6-9 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      baseMultiplier += 0.3;
    }
    
    // Weekend boost
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseMultiplier += 0.2;
    }
    
    // Late night boost (10 PM - 2 AM)
    if (hour >= 22 || hour <= 2) {
      baseMultiplier += 0.4;
    }
    
    // Random demand spikes
    if (Math.random() < 0.15) {
      baseMultiplier += Math.random() * 0.5;
    }
    
    return Math.min(baseMultiplier, 2.5); // Cap at 2.5x
  };

  // Update surge pricing periodically
  useEffect(() => {
    const updateSurge = () => {
      const newSurge = calculateSurgeMultiplier();
      setCurrentSurge(newSurge);
      
      // Generate random surge areas
      if (location && newSurge > 1.2) {
        const areas = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => ({
          lat: location.latitude + (Math.random() - 0.5) * 0.02,
          lng: location.longitude + (Math.random() - 0.5) * 0.02,
          radius: 0.005 + Math.random() * 0.01,
          multiplier: 1.2 + Math.random() * 0.8
        }));
        setSurgeAreas(areas);
      } else {
        setSurgeAreas([]);
      }
    };
    
    updateSurge();
    const interval = setInterval(updateSurge, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [location]);

  // Realistic job consequences - Rank Decay System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const daysSinceLastActivity = Math.floor((now - rankDecay.lastActivityDate) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastActivity > 0 && !user.isOnline) {
        const pointsLost = daysSinceLastActivity * rankDecay.decayRate;
        const newPoints = Math.max(0, rankDecay.points - pointsLost);
        
        // Calculate new rank based on points
        let newRank: UberProTier = 'Blue';
        if (newPoints >= 1000) newRank = 'Diamond';
        else if (newPoints >= 600) newRank = 'Platinum';
        else if (newPoints >= 300) newRank = 'Gold';
        
        // Determine warning level
        let warningLevel: RankDecay['warningLevel'] = 'none';
        let daysUntilDemotion = 30;
        
        if (newRank === 'Diamond' && newPoints < 1000) {
          warningLevel = 'critical';
          daysUntilDemotion = 3;
        } else if (newRank === 'Platinum' && newPoints < 600) {
          warningLevel = 'warning';
          daysUntilDemotion = 7;
        } else if (newRank === 'Gold' && newPoints < 300) {
          warningLevel = 'demotion_imminent';
          daysUntilDemotion = 1;
        }
        
        setRankDecay(prev => ({
          ...prev,
          points: newPoints,
          currentRank: newRank,
          warningLevel,
          daysUntilDemotion,
          lastActivityDate: prev.lastActivityDate
        }));
        
        // Update user profile if rank changed
        if (newRank !== user.tier) {
          setUser(prev => ({ ...prev, tier: newRank, points: newPoints }));
          
          // Add offline notification for rank decay
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'rank_decay_warning',
            title: 'Rank Decay Alert',
            message: `Your rank has decayed to ${newRank} due to inactivity. Get back online to stop the decay!`,
            priority: warningLevel === 'critical' ? 'urgent' : 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user.isOnline, rankDecay.lastActivityDate, rankDecay.decayRate]);

  // Document Expiration System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedDocuments = documentStatuses.map(doc => {
        const daysUntilExpiry = Math.ceil((doc.expiryDate - now) / (24 * 60 * 60 * 1000));
        let status: DocumentStatus['status'] = doc.status;
        let renewalRequired = doc.renewalRequired;
        
        if (daysUntilExpiry <= 0) {
          status = 'expired';
          renewalRequired = true;
        } else if (daysUntilExpiry <= 7) {
          status = 'expiring_soon';
          renewalRequired = true;
        }
        
        return { ...doc, daysUntilExpiry, status, renewalRequired };
      });
      
      setDocumentStatuses(updatedDocuments);
      
      // Check for expired documents and prevent going online
      const hasExpiredDocs = updatedDocuments.some(doc => doc.status === 'expired');
      if (hasExpiredDocs && user.isOnline) {
        setUser(prev => ({ ...prev, isOnline: false }));
        sendNotification("Documents Expired", "You cannot go online with expired documents. Please renew them immediately.", 'high');
        
        const notification: OfflineNotification = {
          id: Math.random().toString(),
          type: 'document_expiry',
          title: 'Document Expired',
          message: 'Your documents have expired. You cannot work until they are renewed.',
          priority: 'urgent',
          timestamp: now,
          isRead: false,
          actionable: true,
          actionUrl: 'account'
        };
        setOfflineNotifications(prev => [notification, ...prev]);
      }
      
      // Send reminders for expiring documents
      updatedDocuments.forEach(doc => {
        if (doc.status === 'expiring_soon' && (!doc.lastReminder || now - doc.lastReminder > 24 * 60 * 60 * 1000)) {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'document_expiry',
            title: 'Document Expiring Soon',
            message: `Your ${doc.type.replace('_', ' ')} expires in ${doc.daysUntilExpiry} days.`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'account'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
          
          setDocumentStatuses(prev => prev.map(d => 
            d.type === doc.type ? { ...d, lastReminder: now } : d
          ));
        }
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Offline Notifications for Surges and Quests
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user.isOnline) {
        const now = Date.now();
        
        // Send surge alerts when offline
        if (currentSurge > 1.5 && Math.random() < 0.3) {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'surge_alert',
            title: '🔥 Surge Pricing Active!',
            message: `${currentSurge.toFixed(1)}x surge in ${currentCity}. You\'re missing out on higher earnings!`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Surge Pricing Active!', {
              body: `${currentSurge.toFixed(1)}x surge in ${currentCity}`,
              icon: '/favicon.ico',
              tag: `surge-${now}`,
              requireInteraction: true
            });
          }
        }
        
        // Send quest expiration warnings
        const expiringQuests = quests.filter(quest => 
          !quest.completed && 
          quest.expiresAt && 
          quest.expiresAt - now < 2 * 60 * 60 * 1000 && // Expires in less than 2 hours
          quest.expiresAt - now > 0 // Not already expired
        );
        
        expiringQuests.forEach(quest => {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'quest_expire_warning',
            title: '⏰ Quest Expiring Soon',
            message: `"${quest.title}" expires soon. Complete it to earn £${quest.reward}!`,
            priority: 'medium',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        });
        
        // Send missed opportunity notifications
        if (Math.random() < 0.1) {
          const missedEarnings = (Math.random() * 20 + 10).toFixed(2);
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'missed_opportunity',
            title: '💸 Missed Earnings',
            message: `You missed out on approximately £${missedEarnings} while offline.`,
            priority: 'low',
            timestamp: now,
            isRead: false,
            actionable: false
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user.isOnline, currentSurge, currentCity, quests]);

  // Financial Pressure System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dayOfWeek = new Date(now).getDay();
      const isStartOfWeek = dayOfWeek === 1; // Monday
      
      if (isStartOfWeek) {
        // Check if weekly target was met
        if (financialPressure.currentWeekProgress < financialPressure.weeklyTarget) {
          const shortfall = financialPressure.weeklyTarget - financialPressure.currentWeekProgress;
          const newDebt = financialPressure.debtAmount + shortfall;
          
          setFinancialPressure(prev => ({
            ...prev,
            debtAmount: newDebt,
            missedWeeklyTargets: prev.missedWeeklyTargets + 1,
            currentWeekProgress: 0
          }));
          
          // Send debt notification
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'missed_opportunity',
            title: '💳 Weekly Target Missed',
            message: `You missed your weekly target by £${shortfall.toFixed(2)}. Debt: £${newDebt.toFixed(2)}`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'earnings'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        } else {
          // Reset weekly progress
          setFinancialPressure(prev => ({
            ...prev,
            currentWeekProgress: 0
          }));
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [financialPressure.currentWeekProgress, financialPressure.weeklyTarget]);

  // Track online/offline status
  useEffect(() => {
    if (user.isOnline) {
      setLastOnlineTime(Date.now());
      setConsecutiveOfflineDays(0);
      setRankDecay(prev => ({ ...prev, lastActivityDate: Date.now() }));
    } else {
      const offlineDuration = Date.now() - lastOnlineTime;
      const offlineDays = Math.floor(offlineDuration / (24 * 60 * 60 * 1000));
      setConsecutiveOfflineDays(offlineDays);
    }
  }, [user.isOnline, lastOnlineTime]);

  // Customer Response Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomerTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(orderId => {
          if (next[orderId] > 0) {
            next[orderId] -= 1;
            changed = true;
          } else if (next[orderId] === 0) {
            // Timer expired
            const order = activeOrders.find(o => o.id === orderId);
            if (order && order.status !== 'returning_to_restaurant') {
              setActiveOrders(current => current.map(o => 
                o.id === orderId ? { ...o, status: 'returning_to_restaurant' as any } : o
              ));
              sendNotification("Customer Unresponsive", `Returning order from ${order.restaurantName} to restaurant.`);
              delete next[orderId];
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOrders]);

  // Background Mode Simulation
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsBackgrounded(hidden);
      
      if (hidden && user.isOnline) {
        sendNotification("Background Mode Active", "You'll still receive order notifications while the app is in the background.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user.isOnline]);

  // UK Units: Miles
  const MILES_PER_DEGREE = 69;

  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false);

  // Geolocation tracking
  useEffect(() => {
    if (isSimulatingMovement) {
      const interval = setInterval(() => {
        setLocation(prev => {
          if (!prev) return { latitude: 51.5074, longitude: -0.1278 };
          return {
            latitude: prev.latitude + (Math.random() - 0.5) * 0.0001,
            longitude: prev.longitude + (Math.random() - 0.5) * 0.0001,
          };
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.error("Error tracking location:", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const sendNotification = (title: string, body: string, priority: 'normal' | 'high' = 'normal') => {
    // Always store in-app notification
    setNotifications(prev => [`${title}: ${body}`, ...prev]);
    
    // Show browser notification if supported and permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      // If app is in background, use service worker
      if (document.hidden && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title,
            body,
            icon: '/favicon.ico',
            tag: `uber-eats-${Date.now()}`,
            data: { priority, timestamp: Date.now() }
          }
        });
      } else {
        // Show notification directly when app is active
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `uber-eats-${Date.now()}`,
          badge: '/favicon.ico',
          requireInteraction: priority === 'high',
          silent: false
        });
        
        // Auto-close normal priority notifications after 5 seconds
        if (priority === 'normal') {
          setTimeout(() => notification.close(), 5000);
        }
        
        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  };

  const generateEmailVerificationCode = () => {
    // 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendEmailVerificationCode = async (email: string) => {
    if (!email) return;

    const now = Date.now();
    if (emailSendCooldownUntil && now < emailSendCooldownUntil) return;

    setIsSendingEmailCode(true);
    const code = generateEmailVerificationCode();
    const expiresAt = now + 10 * 60_000; // 10 minutes

    // Always store code locally as backup
    setPendingEmailCode(code);
    setPendingEmailCodeExpiresAt(expiresAt);
    setEmailCodeInput('');
    setEmailSendCooldownUntil(now + 30_000); // 30s resend cooldown

    try {
      // Try to send real email first
      const emailApiUrl = CLOUD_SEND_EMAIL_CODE_URL || 'http://localhost:3001/api/send-verification-code';
      
      const response = await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code, 
          userName: user.name,
          deviceId 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          sendNotification(
            "Email Verification Code Sent", 
            `Check your inbox at ${email}. Demo code: ${code}`,
            'normal'
          );
        } else {
          throw new Error(result.error || 'Failed to send email');
        }
      } else {
        throw new Error('Email service unavailable');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback to local-only mode
      sendNotification(
        "Email Verification Code Generated", 
        `Email service unavailable. Your code is: ${code}`,
        'normal'
      );
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    try {
      const emailApiUrl = CLOUD_SEND_EMAIL_CODE_URL || 'http://localhost:3001/api/verify-code';
      
      const response = await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return true;
        } else {
          sendNotification("Verification Failed", result.error || 'Invalid code', 'normal');
          return false;
        }
      } else {
        // Fallback to local verification
        return pendingEmailCode === code && Date.now() < (pendingEmailCodeExpiresAt || 0);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      // Fallback to local verification
      return pendingEmailCode === code && Date.now() < (pendingEmailCodeExpiresAt || 0);
    }
  };

  // When we land on email verification screen, ensure we have an active code
  useEffect(() => {
    if (emailVerificationRequired && currentScreen !== 'email_verification') {
      setCurrentScreen('email_verification');
    }
    if (!emailVerificationRequired && currentScreen === 'email_verification') {
      setCurrentScreen('home');
    }
  }, [emailVerificationRequired, currentScreen]);

  // Keep the email input synced with the account when entering the screen
  useEffect(() => {
    if (currentScreen === 'email_verification') {
      setEmailAddressInput(user.email);
    }
  }, [currentScreen, user.email]);

  useEffect(() => {
    if (!emailVerificationRequired) return;
    if (currentScreen !== 'email_verification') return;
    if (pendingEmailCode && pendingEmailCodeExpiresAt && Date.now() < pendingEmailCodeExpiresAt) return;
    if (!emailAddressInput) return;

    void sendEmailVerificationCode(emailAddressInput);
  }, [
    emailVerificationRequired,
    currentScreen,
    pendingEmailCode,
    pendingEmailCodeExpiresAt,
    emailAddressInput,
  ]);

  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const toggleDoc = async (label: string) => {
    if (uploadedDocs.includes(label)) {
      setUploadedDocs(prev => prev.filter(l => l !== label));
      return;
    }

    setUploadingDoc(label);
    await sleep(1500); // Simulate upload time
    setUploadedDocs(prev => [...prev, label]);
    setUploadingDoc(null);
  };

  const allDocsUploaded = uploadedDocs.length === 3;

  // Basic "normal" order generator (less smart, more random)
  const generateNormalOrder = () => {
    if (!location) return null;

    const randomRest = MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)];
    const customerName = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];

    const restLat = location.latitude + randomRest.offset.lat;
    const restLng = location.longitude + randomRest.offset.lng;
    const custLat = restLat + (Math.random() - 0.5) * 0.02;
    const custLng = restLng + (Math.random() - 0.5) * 0.02;

    const distToRest = Math.sqrt(Math.pow(restLat - location.latitude, 2) + Math.pow(restLng - location.longitude, 2)) * MILES_PER_DEGREE;
    const tripDist = Math.sqrt(Math.pow(custLat - restLat, 2) + Math.pow(custLng - restLng, 2)) * MILES_PER_DEGREE;
    
    // Calculate base pay with surge pricing
    let basePay = 3.0 + (tripDist * 1.2) + (Math.random() * 1.5);
    let surgeMultiplier = currentSurge;
    let boostAmount = 0;
    
    // Check if order is in a surge area
    const isInSurgeArea = surgeAreas.some(area => {
      const dist = Math.sqrt(
        Math.pow(restLat - area.lat, 2) + Math.pow(restLng - area.lng, 2)
      );
      return dist <= area.radius;
    });
    
    if (isInSurgeArea) {
      surgeMultiplier = Math.max(surgeMultiplier, surgeAreas.find(area => {
        const dist = Math.sqrt(
          Math.pow(restLat - area.lat, 2) + Math.pow(restLng - area.lng, 2)
        );
        return dist <= area.radius;
      })?.multiplier || currentSurge);
    }
    
    // Apply surge multiplier
    const surgedPay = basePay * surgeMultiplier;
    
    // Occasionally add small bonus for normal orders
    const bonusChance = Math.random();
    let finalPay = surgedPay;
    let orderType = 'Standard';
    
    if (bonusChance < 0.1) {
      boostAmount = 2.0;
      finalPay += boostAmount;
      orderType = 'Bonus';
    }
    
    // Restaurant wait time
    const restaurantWaitTime = Math.floor(5 + Math.random() * 15); // 5-20 minutes

    return {
      id: Math.random().toString(36).substr(2, 9),
      restaurantName: randomRest.name,
      customerName,
      restaurantLocation: { latitude: restLat, longitude: restLng },
      customerLocation: { latitude: custLat, longitude: custLng },
      estimatedPay: finalPay,
      estimatedDistance: tripDist,
      estimatedTime: Math.floor(tripDist * 5 + 4 + restaurantWaitTime),
      status: 'pending' as const,
      items: orderType === 'Bonus' ? ["Meal Deal", "Soft Drink", "Extra Side"] : ["Meal Deal", "Soft Drink"],
      distToRest,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      matchingType: 'normal' as const,
      orderType,
      surgeMultiplier: surgeMultiplier > 1.0 ? surgeMultiplier : undefined,
      boostAmount: boostAmount > 0 ? boostAmount : undefined,
      restaurantWaitTime,
    };
  };

  // Improved Order Matching Algorithm (smart)
  const generateSmartOrder = () => {
    if (!location) return null;

    // 1. Generate 8 candidate orders for better selection
    const candidates = Array.from({ length: 8 }).map(() => {
      const randomRest = MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)];
      const customerName = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];
      
      const restLat = location.latitude + randomRest.offset.lat;
      const restLng = location.longitude + randomRest.offset.lng;
      const custLat = restLat + (Math.random() - 0.5) * 0.01;
      const custLng = restLng + (Math.random() - 0.5) * 0.01;

      const distToRest = Math.sqrt(Math.pow(restLat - location.latitude, 2) + Math.pow(restLng - location.longitude, 2)) * MILES_PER_DEGREE;
      const tripDist = Math.sqrt(Math.pow(custLat - restLat, 2) + Math.pow(custLng - restLng, 2)) * MILES_PER_DEGREE;
      
      // Smart orders have better base pay and more variety
      const orderTypeRoll = Math.random();
      let basePay = 3.50 + (tripDist * 1.5) + (Math.random() * 2);
      let items = ["Meal Deal", "Extra Fries", "Coke Zero"];
      let orderType = 'Smart Match';
      let surgeMultiplier = currentSurge;
      let boostAmount = 0;
      
      // Check if order is in a surge area (smart orders get priority in surge areas)
      const isInSurgeArea = surgeAreas.some(area => {
        const dist = Math.sqrt(
          Math.pow(restLat - area.lat, 2) + Math.pow(restLng - area.lng, 2)
        );
        return dist <= area.radius;
      });
      
      if (isInSurgeArea) {
        surgeMultiplier = Math.max(surgeMultiplier, surgeAreas.find(area => {
          const dist = Math.sqrt(
            Math.pow(restLat - area.lat, 2) + Math.pow(restLng - area.lng, 2)
          );
          return dist <= area.radius;
        })?.multiplier || currentSurge);
        basePay *= 1.2; // Smart orders get extra boost in surge areas
      }
      
      if (orderTypeRoll < 0.15) {
        // 15% chance for premium order
        basePay += 5.0;
        items = ["Premium Burger", "Large Fries", "Milkshake", "Dessert"];
        orderType = 'Premium';
      } else if (orderTypeRoll < 0.3) {
        // 15% chance for urgent order
        basePay += 3.0;
        items = ["Express Meal", "Drink"];
        orderType = 'Urgent';
      }
      
      // Apply surge multiplier
      const surgedPay = basePay * surgeMultiplier;
      
      // Restaurant wait time (smart orders have slightly better wait times)
      const restaurantWaitTime = Math.floor(3 + Math.random() * 12); // 3-15 minutes

      return {
        id: Math.random().toString(36).substr(2, 9),
        restaurantName: randomRest.name,
        customerName,
        restaurantLocation: { latitude: restLat, longitude: restLng },
        customerLocation: { latitude: custLat, longitude: custLng },
        estimatedPay: surgedPay,
        estimatedDistance: tripDist,
        estimatedTime: Math.floor(tripDist * 5 + 5 + restaurantWaitTime),
        status: 'pending' as const,
        items,
        distToRest,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        matchingType: 'smart' as const,
        orderType,
        surgeMultiplier: surgeMultiplier > 1.0 ? surgeMultiplier : undefined,
        boostAmount: boostAmount > 0 ? boostAmount : undefined,
        restaurantWaitTime,
      };
    });

    // 2. Score each candidate
    const scoredCandidates = candidates.map(order => {
      let score = 0;

      // Factor 1: Proximity to driver (Closer is better)
      score += (10 / (order.distToRest + 0.5));

      // Factor 2: Pay (Higher is better)
      score += (order.estimatedPay * 2);

      // Factor 3: Route Alignment (Stacked orders)
      if (activeOrders.length > 0) {
        activeOrders.forEach(active => {
          const target = active.status === 'accepted' ? active.restaurantLocation : active.customerLocation;
          
          // Check if new restaurant is near current target
          const distToRestFromActive = Math.sqrt(
            Math.pow(order.restaurantLocation.latitude - target.latitude, 2) + 
            Math.pow(order.restaurantLocation.longitude - target.longitude, 2)
          ) * MILES_PER_DEGREE;

          // Check if new customer is near current target
          const distToCustFromActive = Math.sqrt(
            Math.pow(order.customerLocation.latitude - target.latitude, 2) + 
            Math.pow(order.customerLocation.longitude - target.longitude, 2)
          ) * MILES_PER_DEGREE;
          
          // Boost score if either restaurant or customer is nearby
          if (distToRestFromActive < 0.5) score += 40;
          if (distToCustFromActive < 0.5) score += 20;
          
          // Extra boost if both are somewhat aligned (efficient route)
          if (distToRestFromActive < 1 && distToCustFromActive < 1) score += 15;
        });
      }

      return { order, score };
    });

    // 3. Pick the best one
    const best = scoredCandidates.sort((a, b) => b.score - a.score)[0].order;
    return best;
  };

  // Simple "busy" score based on hotspots + time of day
  const getBusyScore = () => {
    let score = 0;
    if (hotspots.length > 0) {
      const avgIntensity =
        hotspots.reduce((sum, h) => sum + h.intensity, 0) / hotspots.length;
      score += avgIntensity * 2; // up to ~2
    }
    const hour = new Date().getHours();
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) {
      // lunch + dinner peaks
      score += 1.5;
    }
    return Math.min(score, 3); // cap
  };

  // Simulate incoming orders when online
  useEffect(() => {
    if (user.isOnline && activeOrders.length < 3 && !pendingOrder) {
      const busy = getBusyScore();
      // Base delay between orders (ms)
      const minBase = 8000;
      const maxBase = 22000;
      // Busy -> closer to minBase, quiet -> closer to maxBase
      const factor = 1 - busy / 3; // busy=3 -> 0, quiet=0 -> 1
      const baseDelay = minBase + (maxBase - minBase) * factor;
      const jitter = 0.4 + Math.random() * 0.6; // 0.4x–1.0x variation

      const timer = setTimeout(() => {
        // Randomly decide between smart matching and normal matching
        const useSmart = Math.random() < 0.6; // ~60% smart, 40% normal
        const newOrder = useSmart ? generateSmartOrder() : generateNormalOrder();
        if (newOrder) {
          setPendingOrder(newOrder);
          setOrderExpiryTimer(10);
          
          // Enhanced notifications based on order type
          let soundType = useSmart ? 'smart_match' : 'normal_match';
          let notificationTitle = "New Order";
          let notificationBody = `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName}`;
          
          if (newOrder.orderType === 'Premium') {
            soundType = 'bonus';
            notificationTitle = "🌟 Premium Order!";
            notificationBody = `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName} • High Value!`;
          } else if (newOrder.orderType === 'Urgent') {
            soundType = 'urgent';
            notificationTitle = "🚨 Urgent Order!";
            notificationBody = `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName} • Time Sensitive!`;
          } else if (newOrder.orderType === 'Bonus') {
            soundType = 'bonus';
            notificationTitle = "💰 Bonus Order!";
            notificationBody = `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName} • Extra Pay!`;
          } else if (newOrder.orderType === 'Smart Match') {
            soundType = 'smart_match';
            notificationTitle = "🎯 Smart Match";
            notificationBody = `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName} • AI Optimized!`;
          } else if (useSmart) {
            soundType = 'smart_match';
            notificationTitle = "🎯 Smart Match";
          }
          
          sendNotification(notificationTitle, notificationBody, 'high');
          playUberSound(soundType);
        }
      }, baseDelay * jitter);
      return () => clearTimeout(timer);
    }
  }, [user.isOnline, activeOrders, pendingOrder, location, hotspots]);

  const handleAcceptOrder = () => {
    if (pendingOrder) {
      setActiveOrders(prev => [...prev, { ...pendingOrder, status: 'accepted' }]);
      setPendingOrder(null);
      setOrderExpiryTimer(10);
      playUberSound('accept');
    }
  };

  const handleDeclineOrder = () => {
    setPendingOrder(null);
    setOrderExpiryTimer(10);
    playUberSound('accept');
  };

  const handleCancelOrder = (orderId: string) => {
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
    setCancellingOrderId(null);
    sendNotification("Trip Cancelled", "The trip has been removed from your active tasks.");
    playUberSound('accept');
  };

  const handleNextStep = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    if (order.status === 'accepted') {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up' } : o));
      sendNotification("Order Picked Up", `Head to ${order.customerName}'s location`);
      playUberSound('accept');
    } else if (order.status === 'picked_up') {
      setVerifyingDeliveryId(orderId);
    }
  };

  const distanceToTarget = (order: Order) => {
    if (!location) return "0.0";
    const target = order.status === 'accepted' ? order.restaurantLocation : order.customerLocation;
    const dLat = target.latitude - location.latitude;
    const dLng = target.longitude - location.longitude;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * MILES_PER_DEGREE;
    return dist.toFixed(1);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const [emailVerifyRequestedForOnline, setEmailVerifyRequestedForOnline] = useState(false);

  const playUberSound = (type: 'order' | 'accept' | 'message' | 'complete' | 'smart_match' | 'normal_match' | 'urgent' | 'bonus' | 'error' | 'notification' | 'success') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createBeepSequence = (frequencies: number[], durations: number[], volume: number = 0.1) => {
        frequencies.forEach((freq, index) => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
          oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.1);
          gainNode.gain.setValueAtTime(volume, audioCtx.currentTime + index * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + index * 0.1 + durations[index]);
          
          oscillator.start(audioCtx.currentTime + index * 0.1);
          oscillator.stop(audioCtx.currentTime + index * 0.1 + durations[index]);
        });
      };

      if (type === 'order') {
        // Classic Uber order ping - ascending chime
        createBeepSequence([440, 554, 659], [0.15, 0.15, 0.2], 0.12);
      } else if (type === 'smart_match') {
        // Smart match - more sophisticated triple chime
        createBeepSequence([523, 659, 784], [0.1, 0.1, 0.15], 0.15);
      } else if (type === 'normal_match') {
        // Normal match - simple double beep
        createBeepSequence([440, 554], [0.1, 0.1], 0.08);
      } else if (type === 'urgent') {
        // Urgent order - rapid alert pattern
        createBeepSequence([880, 880, 1047], [0.08, 0.08, 0.15], 0.15);
      } else if (type === 'bonus') {
        // Bonus earnings - celebration sound
        createBeepSequence([659, 784, 880, 1047], [0.1, 0.1, 0.1, 0.2], 0.12);
      } else if (type === 'accept') {
        // Accept - satisfying confirmation
        createBeepSequence([659, 523], [0.1, 0.15], 0.08);
      } else if (type === 'message') {
        // Message - subtle notification
        createBeepSequence([660, 880], [0.08, 0.08], 0.06);
      } else if (type === 'complete') {
        // Complete - success fanfare
        createBeepSequence([523, 659, 784, 1047], [0.12, 0.12, 0.12, 0.25], 0.15);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!pendingEmailCode || !pendingEmailCodeExpiresAt) return;
    
    const email = emailAddressInput || user.email;
    const code = emailCodeInput.trim();
    
    // First try server verification
    const isValid = await verifyEmailCode(email, code);
    
    if (isValid) {
      // Mark this device as verified for the account
      setUser(u => ({
        ...u,
        email: email,
        emailVerifiedDeviceId: deviceId,
        // If they requested this verification to go online, allow it immediately.
        isOnline: emailVerifyRequestedForOnline ? true : u.isOnline,
      }));

      setEmailVerifyRequestedForOnline(false);
      setPendingEmailCode(null);
      setPendingEmailCodeExpiresAt(null);
      setEmailCodeInput('');
      playUberSound('accept');
      sendNotification("Email Verified", "Your email is verified for this device.");
      setCurrentScreen('home');
    } else {
      sendNotification("Verification Failed", "Invalid or expired verification code. Please try again.", 'normal');
    }
  };

  const handleVerifyFace = () => {
    if (user.faceVerified || isVerifying || (lockoutUntil && Date.now() < lockoutUntil)) {
      return;
    }
    
    setIsVerifyingToOnline(true);
    playUberSound('message');
  };

  const [isFlashing, setIsFlashing] = useState(false);

  // Authentication Functions
  const handleLogin = async () => {
    if (!loginCredentials.email || !loginCredentials.password) {
      setAuthError('Please enter email and password');
      return;
    }

    setIsLoadingAuth(true);
    setAuthError('');

    try {
      const response = await cloudStorage.loginUser(loginCredentials);
      
      if (response.success) {
        if (response.requiresVerification) {
          // User needs to verify
          setVerificationMethod(response.verificationMethod!);
          setCurrentScreen('email_verification');
        } else {
          // Login successful
          const session = cloudStorage.getCurrentSession();
          setAuthSession(session);
          
          // Load user profile from cloud
          await loadUserProfile(response.userId!);
          setCurrentScreen('home');
        }
      } else {
        setAuthError(response.error || 'Login failed');
      }
    } catch (error) {
      setAuthError('Login failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleRegister = async () => {
    if (!registerCredentials.email || !registerCredentials.password) {
      setAuthError('Please enter email and password');
      return;
    }

    if (registerCredentials.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setIsLoadingAuth(true);
    setAuthError('');

    try {
      const response = await cloudStorage.registerUser(registerCredentials);
      
      if (response.success) {
        if (response.requiresVerification) {
          setVerificationMethod(response.verificationMethod!);
          setCurrentScreen('email_verification');
        } else {
          // Registration successful
          const session = cloudStorage.getCurrentSession();
          setAuthSession(session);
          setCurrentScreen('home');
        }
      } else {
        setAuthError(response.error || 'Registration failed');
      }
    } catch (error) {
      setAuthError('Registration failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setAuthError('Please enter verification code');
      return;
    }

    setIsLoadingAuth(true);
    setAuthError('');

    try {
      let response;
      
      if (verificationMethod === 'email') {
        response = await cloudStorage.verifyEmailCode(
          isRegistering ? registerCredentials.email : loginCredentials.email,
          verificationCode
        );
      } else {
        response = await cloudStorage.verifySMSCode(
          isRegistering ? registerCredentials.phoneNumber! : loginCredentials.phoneNumber!,
          verificationCode
        );
      }

      if (response.success) {
        const session = cloudStorage.getCurrentSession();
        setAuthSession(session);
        
        // Load or create user profile
        await loadUserProfile(response.userId!);
        
        // Auto-sync to cloud for new users
        if (isRegistering) {
          await cloudStorage.saveProfile({
            email: session!.email,
            name: registerCredentials.email.split('@')[0],
            rating: 5.0,
            tier: 'Blue',
            points: 0,
            deliveries: 0,
            isOnline: false,
            documentsUploaded: false,
            faceVerified: false,
            earnings: 0,
            bankBalance: 0,
            purchasedItems: [],
            totalDistance: 0,
            totalTime: 0,
            achievements: []
          });
        }
        
        setCurrentScreen('home');
      } else {
        setAuthError(response.error || 'Verification failed');
      }
    } catch (error) {
      setAuthError('Verification failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoadingAuth(true);
    setAuthError('');

    try {
      let success;
      
      if (verificationMethod === 'email') {
        success = await cloudStorage.sendEmailVerification(
          isRegistering ? registerCredentials.email : loginCredentials.email
        );
      } else {
        success = await cloudStorage.sendSMSVerification(
          isRegistering ? registerCredentials.phoneNumber! : loginCredentials.phoneNumber!
        );
      }

      if (!success) {
        setAuthError('Failed to resend verification code');
      }
    } catch (error) {
      setAuthError('Failed to resend verification code');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    cloudStorage.logout();
    setAuthSession(null);
    setLoginCredentials({ email: '', password: '' });
    setRegisterCredentials({ email: '', password: '', phoneNumber: '' });
    setVerificationCode('');
    setAuthError('');
    setCurrentScreen('onboarding');
  };

  const loadUserProfile = async (userId: string) => {
    try {
      // Try to load from cloud first
      const cloudProfile = await cloudStorage.loadProfile();
      
      if (cloudProfile) {
        setUser({
          name: cloudProfile.name,
          rating: cloudProfile.rating,
          tier: cloudProfile.tier,
          points: cloudProfile.points,
          deliveries: cloudProfile.deliveries,
          isOnline: cloudProfile.isOnline,
          documentsUploaded: cloudProfile.documentsUploaded,
          faceVerified: cloudProfile.faceVerified,
          email: cloudProfile.email,
          profilePic: cloudProfile.profilePic
        });
        setEarnings(cloudProfile.earnings);
        setBankBalance(cloudProfile.bankBalance);
      } else {
        // Create default profile for new users
        const defaultProfile = {
          name: 'Driver',
          rating: 5.0,
          tier: 'Blue' as UberProTier,
          points: 0,
          deliveries: 0,
          isOnline: false,
          documentsUploaded: false,
          faceVerified: false,
          email: authSession?.email || '',
          profilePic: undefined
        };
        setUser(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const session = cloudStorage.getCurrentSession();
    if (session) {
      setAuthSession(session);
      loadUserProfile(session.userId);
      setCurrentScreen('home');
    }
  }, []);

  // Verification function for going online
  const verifyToGoOnline = async () => {
    setIsVerifying(true);
    playUberSound('message');
    
    // 1. Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    // Capture frame for profile pic
    let capturedPic = "";
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        capturedPic = canvas.toDataURL('image/jpeg');
      }
    }
    
    // Sometimes fail to simulate "face not recognised"
    const isSuccess = Math.random() > 0.15;

    if (isSuccess) {
      setUser(u => ({ 
        ...u, 
        faceVerified: true, 
        // Only go online immediately if the "email verified for this device" check passed.
        // Otherwise, we route you into email verification.
        isOnline: isEmailVerifiedForThisDevice,
        profilePic: capturedPic || u.profilePic
      }));
      sendNotification("Identity Verified", "Your face verification was successful.");
      playUberSound('accept');
      
      await sleep(1500);
      stopCamera();
      setIsVerifyingToOnline(false);
      setIsVerifying(false);
      if (user.email && !isEmailVerifiedForThisDevice) {
        setCurrentScreen('email_verification');
      } else {
        setCurrentScreen('home');
      }
    } else {
      // 1-minute lockout when face isn't recognised
      setLockoutUntil(Date.now() + 60000);
      sendNotification("Face Not Recognised", "Try again in 1 minute.");
      stopCamera();
      setIsVerifyingToOnline(false);
      setIsVerifying(false);
      // Stay on screen to show lockout timer
    }
  };

  // When going online, keep the bottom menu closed by default
  useEffect(() => {
    if (isVerifyingToOnline) {
      verifyToGoOnline();
    }
  }, [isVerifyingToOnline]);

  // UI Components
  const EarningsDetail = () => {
    const [page, setPage] = useState(0);
    const pages = ['Today', 'Weekly', 'Recent'];

    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute inset-0 z-[300] bg-black text-white flex flex-col"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentScreen('home')} className="p-2 bg-white/10 rounded-full"><X size={24} /></button>
            <h2 className="text-xl font-black">Earnings</h2>
            <div className="w-10" />
          </div>

          <div className="flex bg-white/10 p-1 rounded-2xl">
            {pages.map((p, i) => (
              <button 
                key={p}
                onClick={() => setPage(i)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${page === i ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            {page === 0 && (
              <motion.div 
                key="today" 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -50 }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">Today's Earnings</p>
                  <h1 className="text-5xl font-black">£{earnings.toFixed(2)}</h1>
                  <p className="text-green-500 font-bold mt-2 flex items-center justify-center gap-1">
                    <TrendingUp size={16} /> +12% from yesterday
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-3xl">
                    <p className="text-gray-400 text-xs font-bold mb-1">Trips</p>
                    <p className="text-xl font-black">{user.deliveries}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl">
                    <p className="text-gray-400 text-xs font-bold mb-1">Time Online</p>
                    <p className="text-xl font-black">4h 22m</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-lg">Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-500">Fare</span>
                      <span>£{(earnings * 0.7).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-500">Tips</span>
                      <span>£{(earnings * 0.2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-500">Promotions</span>
                      <span>£{(earnings * 0.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {page === 1 && (
              <motion.div 
                key="weekly" 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -50 }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">Weekly Total</p>
                  <h1 className="text-5xl font-black">£{(earnings * 5.4).toFixed(2)}</h1>
                  <p className="text-gray-400 font-bold mt-2">Mar 30 - Apr 5</p>
                </div>

                <div className="h-40 flex items-end justify-between gap-2 px-4">
                  {[40, 70, 45, 90, 65, 85, 30].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: `${h}%` }} 
                        className={`w-full rounded-t-lg ${i === 6 ? 'bg-blue-600' : 'bg-white/10'}`} 
                      />
                      <span className="text-[10px] font-bold text-gray-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-900/20 p-6 rounded-3xl border border-blue-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-black">Top Earner</h4>
                      <p className="text-sm text-blue-400 font-bold">You're in the top 5% this week!</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {page === 2 && (
              <motion.div 
                key="recent" 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -50 }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="space-y-4"
              >
                <h3 className="font-black text-lg">Recent Transactions</h3>
                {[
                  { label: 'Trip - Greggs', time: '2:14 PM', amount: '£4.50' },
                  { label: 'Trip - Wagamama', time: '1:45 PM', amount: '£8.20' },
                  { label: 'Promotion - Lunch Rush', time: '1:00 PM', amount: '£2.00' },
                  { label: 'Trip - Nando\'s', time: '12:30 PM', amount: '£6.75' },
                  { label: 'Trip - Costa Coffee', time: '11:15 AM', amount: '£3.80' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                    <div>
                      <p className="font-bold">{t.label}</p>
                      <p className="text-xs text-gray-400 font-bold">{t.time}</p>
                    </div>
                    <p className="font-black text-lg">{t.amount}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="flex justify-center gap-2 mb-6">
            {pages.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${page === i ? 'w-4 bg-blue-600' : 'bg-white/10'}`} />
            ))}
          </div>
          <button 
            onClick={() => {
              if (earnings > 0) {
                setBankBalance(prev => prev + earnings);
                setEarnings(0);
                sendNotification("Cash Out Successful", "£" + earnings.toFixed(2) + " has been sent to your bank account.");
                playUberSound('complete');
                setCurrentScreen('banking');
              }
            }}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg active:scale-95 transition-transform"
          >
            CASH OUT
          </button>
        </div>
      </motion.div>
    );
  };

  const DeliveryVerificationModal = () => {
    const order = activeOrders.find(o => o.id === verifyingDeliveryId);
    if (!order) return null;

    const handleComplete = () => {
      if (enteredPin === order.pin || isPhotoCaptured) {
        setActiveOrders(prev => prev.filter(o => o.id !== order.id));
        setEarnings(prev => prev + order.estimatedPay);
        setUser(u => ({ ...u, deliveries: u.deliveries + 1, points: u.points + 10 }));
        sendNotification("Delivery Complete", `You earned £${order.estimatedPay.toFixed(2)}`);
        playUberSound('complete');
        setVerifyingDeliveryId(null);
        setEnteredPin("");
        setIsPhotoCaptured(false);
        
        // Generate customer rating
        generateRating(order);
        
        // Update quest progress
        updateQuestProgress('daily-deliveries', 1);
        if (order.surgeMultiplier && order.surgeMultiplier > 1.0) {
          updateQuestProgress('surge-hunter', 1);
        }
        setCustomerTimers(prev => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
      }
    };

    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute inset-0 z-[200] bg-white text-black p-6 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black">Verify Delivery</h2>
          <button onClick={() => setVerifyingDeliveryId(null)} className="p-2 bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-8">
          <div className="p-6 bg-gray-50 rounded-3xl">
            <h3 className="font-bold text-lg mb-2">Customer: {order.customerName}</h3>
            <p className="text-sm text-gray-500 mb-4">Ask the customer for their 4-digit PIN or take a photo of the delivery.</p>
            
            <div className="flex gap-2 justify-center mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${enteredPin[i] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  {enteredPin[i] || ""}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map(val => (
                <button 
                  key={val}
                  onClick={() => {
                    if (val === "C") setEnteredPin("");
                    else if (val === "OK") handleComplete();
                    else if (enteredPin.length < 4) setEnteredPin(prev => prev + val);
                  }}
                  className="h-16 bg-white rounded-xl font-black text-xl shadow-sm active:scale-95 transition-transform"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm font-bold text-gray-400">OR</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsPhotoCaptured(true);
              setTimeout(handleComplete, 1000);
            }}
            className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${isPhotoCaptured ? 'bg-green-500 text-white' : 'bg-gray-100 text-black active:scale-95'}`}
          >
            {isPhotoCaptured ? <Check /> : <Camera />}
            {isPhotoCaptured ? 'PHOTO CAPTURED' : 'TAKE PHOTO'}
          </button>
        </div>
      </motion.div>
    );
  };

  const SideMenu = () => (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      className="absolute inset-0 z-[100] bg-black text-white flex flex-col"
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-full overflow-hidden">
            <img src={user.profilePic || "https://picsum.photos/seed/driver/200/200"} alt="Me" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-black text-xl">{user.name}</h2>
            <p className="text-sm font-bold text-gray-400">{user.rating} ★ • {user.tier} Tier</p>
          </div>
        </div>
        <button onClick={() => setIsSideMenuOpen(false)} className="p-2 bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[
          { icon: <Briefcase />, label: "Opportunities", screen: 'opportunities' },
          { icon: <TrendingUp />, label: "Earnings", screen: 'earnings_detail' },
          { icon: <CreditCard />, label: "Wallet", screen: 'wallet' },
          { icon: <Star />, label: "Uber Pro", screen: 'uber_pro' },
          { icon: <Map />, label: "Heatmap", screen: 'heatmap' },
          { icon: <Users />, label: "Referrals", screen: 'referrals' },
          { icon: <Car />, label: "Vehicles", screen: 'vehicles' },
          { icon: <Calendar />, label: "Scheduled", screen: 'scheduled' },
          { icon: <Fuel />, label: "Fuel Tracking", screen: 'fuel' },
          { icon: <PhoneCall />, label: "Emergency", screen: 'emergency' },
          { icon: <BarChart3 />, label: "Analytics", screen: 'analytics' },
          { icon: <Gift />, label: "Promotions", screen: 'promotions' },
          { icon: <QrCode />, label: "QR Scanner", screen: 'qr_scanner' },
          { icon: <ShieldAlert />, label: "Safety", screen: 'safety' },
          { icon: <Settings />, label: "Settings", screen: 'account' },
          { icon: <HelpCircle />, label: "Help", screen: 'home' },
        ].map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => { setCurrentScreen(item.screen as AppScreen); setIsSideMenuOpen(false); }}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors"
          >
            <div className="text-gray-400">{item.icon}</div>
            <span className="font-bold text-lg">{item.label}</span>
          </button>
        ))}
        
        <div className="mt-4 p-4 bg-white/5 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Background Mode</span>
            <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>
          <p className="text-[10px] text-gray-400 font-bold leading-tight mb-4">
            When online, the app will continue to track your location and send notifications even if you switch to another tab.
          </p>
          {user.isOnline && (
            <button 
              onClick={() => { setUser(u => ({ ...u, isOnline: false, faceVerified: false })); setIsSideMenuOpen(false); }}
              className="w-full py-3 bg-red-900/20 text-red-500 rounded-xl font-black text-xs border border-red-500/20 active:scale-95 transition-transform"
            >
              GO OFFLINE
            </button>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }} 
          className="flex items-center gap-4 text-red-500 font-black active:scale-95 transition-transform"
        >
          <LogOut size={24} />
          <span>Log out</span>
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className={`relative w-full h-screen overflow-hidden ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} ${getResponsiveClass('font-sans', 'font-sans', 'font-sans')}`}>
      {/* Main App Container - Responsive Layout */}
      <div className={`relative w-full h-full ${getResponsiveClass('max-w-md mx-auto', 'max-w-lg mx-auto', 'max-w-7xl mx-auto')}`}>
        {/* Mobile-First Navigation */}
        <AnimatePresence>
          {currentScreen === 'home' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute top-0 left-0 right-0 z-[100] ${getResponsiveClass('px-4', 'px-8', 'px-12')} py-2 ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-sm border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSideMenuOpen(true)}
                    className={`p-2 rounded-full ${getResponsiveClass('bg-white/10', 'bg-white/10', 'bg-white/10')} hover:bg-white/20 transition-colors`}
                  >
                    <Menu size={getResponsiveValue(20, 24, 28)} />
                  </button>
                  <h1 className={`font-black ${getResponsiveValue('text-lg', 'text-2xl', 'text-3xl')}`}>
                    Uber Eats
                  </h1>
                </div>
                
                <div className={`flex items-center gap-4 ${getResponsiveClass('gap-2', 'gap-4', 'gap-6')}`}>
                  <button
                    onClick={() => setCurrentScreen('earnings')}
                    className={`p-2 rounded-full ${getResponsiveClass('bg-white/10', 'bg-white/10', 'bg-white/10')} hover:bg-white/20 transition-colors`}
                  >
                    <TrendingUp size={getResponsiveValue(18, 20, 22)} />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('inbox')}
                    className={`p-2 rounded-full ${getResponsiveClass('bg-white/10', 'bg-white/10', 'bg-white/10')} hover:bg-white/20 transition-colors`}
                  >
                    <MessageSquare size={getResponsiveValue(18, 20, 22)} />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('account')}
                    className={`p-2 rounded-full ${getResponsiveClass('bg-white/10', 'bg-white/10', 'bg-white/10')} hover:bg-white/20 transition-colors`}
                  >
                    <User size={getResponsiveValue(18, 20, 22)} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Offline Notifications Display */}
          {currentScreen === 'home' && offlineNotifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute top-20 left-4 right-4 z-[90] space-y-2`}
            >
              {offlineNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-2xl backdrop-blur-md border ${
                    notification.priority === 'urgent' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                    notification.priority === 'high' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                    notification.priority === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                    'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-black text-sm">{notification.title}</p>
                      <p className="text-xs opacity-80 mt-1">{notification.message}</p>
                    </div>
                    {notification.actionable && (
                      <button
                        onClick={() => {
                          if (notification.actionUrl) {
                            setCurrentScreen(notification.actionUrl as AppScreen);
                          }
                          setOfflineNotifications(prev => prev.filter(n => n.id !== notification.id));
                        }}
                        className="px-2 py-1 bg-white/20 rounded-full text-xs font-black"
                      >
                        Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentScreen === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full bg-white text-black p-8 flex flex-col justify-center">
              <div className="mb-12">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-white text-4xl font-black">U</span>
                </div>
                <h1 className="text-4xl font-black leading-tight">Drive when you want,<br/>earn what you need</h1>
              </div>
              <div className="space-y-4">
                <button onClick={() => setCurrentScreen('documents')} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl tracking-wide">
                  CONTINUE
                </button>
                <p className="text-center text-sm text-gray-400 font-bold">By continuing, you agree to our Terms of Service</p>
              </div>
            </motion.div>
          )}

          {currentScreen === 'documents' && (
            <motion.div key="documents" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="h-full w-full bg-white text-black p-6 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('onboarding')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Documents</h1>
              </div>
              <p className="text-gray-400 font-bold mb-8">Tap each item to upload your documents.</p>
              
              <div className="space-y-4 flex-1">
                {[
                  { label: "Driving Licence", icon: <FileText /> },
                  { label: "Vehicle Insurance", icon: <ShieldCheck /> },
                  { label: "Bank Statement", icon: <CreditCard /> },
                ].map((doc, i) => {
                  const isUploaded = uploadedDocs.includes(doc.label);
                  const isUploading = uploadingDoc === doc.label;
                  return (
                    <button 
                      key={i} 
                      onClick={() => !isUploading && toggleDoc(doc.label)}
                      disabled={isUploading}
                      className={`w-full p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${isUploaded ? 'border-green-500 bg-green-50' : isUploading ? 'border-blue-500 bg-blue-50' : 'border-gray-100 active:scale-95'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={isUploaded ? 'text-green-500' : isUploading ? 'text-blue-500' : 'text-gray-400'}>{doc.icon}</div>
                        <span className="font-bold">{isUploading ? 'Uploading...' : doc.label}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUploaded ? 'bg-green-500 text-white' : isUploading ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                        {isUploaded ? <Check size={20} /> : isUploading ? <Clock size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {!allDocsUploaded && (
                  <p className="text-center text-xs font-bold text-red-500">Please upload all documents to continue</p>
                )}
                <button 
                  onClick={() => {
                    setUser(u => ({ ...u, documentsUploaded: true }));
                    setCurrentScreen('face_verification');
                  }} 
                  disabled={!allDocsUploaded}
                  className={`w-full py-5 rounded-2xl font-black text-xl transition-all ${allDocsUploaded ? 'bg-black text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  NEXT
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'face_verification' && (
            <motion.div key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full bg-black text-white p-6 flex flex-col items-center relative">
              {/* Flash Effect */}
              <AnimatePresence>
                {isFlashing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-[100]"
                  />
                )}
              </AnimatePresence>

              <div className="absolute top-8 left-6">
                <button
                  onClick={() => {
                    setEmailVerifyRequestedForOnline(false);
                    setEmailCodeInput('');
                    setCurrentScreen('home');
                  }}
                  className="p-2 bg-white/10 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <h1 className="text-2xl font-black mt-12 mb-4">Face Verification</h1>
              <p className="text-center text-gray-400 mb-12">Position your face in the circle to verify your identity.</p>
              
              <div className="w-72 h-72 rounded-full border-4 border-blue-500 overflow-hidden relative mb-12 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                {lockoutUntil && Date.now() < lockoutUntil ? (
                  <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-8 text-center">
                    <Lock size={48} className="text-red-500 mb-4" />
                    <h3 className="font-black text-xl mb-2">LOCKED OUT</h3>
                    <p className="text-sm text-red-200">Too many failed attempts. Try again in {Math.ceil((lockoutUntil - Date.now()) / 1000)}s</p>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && !el.srcObject) startCamera();
                      }} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                    
                    {/* Scanning Animation Overlay */}
                    <motion.div 
                      animate={{ y: [0, 288, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] z-10"
                    />
                  </>
                )}
                
                <div className="absolute inset-0 border-[20px] border-black/50 rounded-full" />
                
                {/* Success Overlay */}
                <AnimatePresence>
                  {user.faceVerified && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center z-20"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                        <Check size={48} className="text-green-500" strokeWidth={4} />
                      </div>
                      <span className="font-black text-xl">VERIFIED</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleVerifyFace}
                id="verify-btn"
                disabled={user.faceVerified || isVerifying || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                className={`w-full py-5 rounded-2xl font-black text-xl transition-all ${user.faceVerified ? 'bg-green-500 text-white' : (lockoutUntil && Date.now() < lockoutUntil) ? 'bg-gray-800 text-gray-500' : 'bg-white text-black active:scale-95'}`}
              >
                {user.faceVerified ? 'SUCCESS' : isVerifying ? 'VERIFYING...' : (lockoutUntil && Date.now() < lockoutUntil) ? 'LOCKED' : 'VERIFY'}
              </button>
            </motion.div>
          )}

          {currentScreen === 'email_verification' && (
            <motion.div
              key="email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-black text-white p-6 flex flex-col items-center relative"
            >
              <div className="absolute top-8 left-6">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <h1 className="text-2xl font-black mt-12 mb-2">Verify Your Email</h1>
              <p className="text-center text-gray-400 mb-8">
                We sent a 6-digit code to
                <span className="text-white font-black"> {emailAddressInput || user.email}</span>
                <div className="text-center mt-2 text-[10px] text-gray-500 font-bold">
                  From: uberclone@game.com
                </div>
              </p>

              <div className="w-full max-w-md bg-white/5 rounded-3xl p-6 border border-white/10">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Email Code
                </label>
                <input
                  value={emailCodeInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setEmailCodeInput(v);
                  }}
                  inputMode="numeric"
                  placeholder="000000"
                  className="mt-3 w-full py-4 rounded-2xl bg-black/40 border border-white/10 text-center font-black text-xl tracking-[0.25em] outline-none"
                />

                {pendingEmailCode && (
                  <div className="mt-3 text-center text-[10px] text-blue-300 font-bold">
                    Demo code: {pendingEmailCode}
                  </div>
                )}

                {pendingEmailCodeExpiresAt && Date.now() < pendingEmailCodeExpiresAt && (
                  <div className="mt-2 text-center text-[10px] text-gray-400 font-bold">
                    Expires in {Math.ceil((pendingEmailCodeExpiresAt - Date.now()) / 1000)}s
                  </div>
                )}

                <button
                  onClick={handleVerifyEmailCode}
                  disabled={
                    isSendingEmailCode ||
                    !pendingEmailCode ||
                    !pendingEmailCodeExpiresAt ||
                    !emailCodeInput ||
                    Date.now() > pendingEmailCodeExpiresAt
                  }
                  className={`w-full mt-6 py-5 rounded-2xl font-black text-xl transition-all ${
                    pendingEmailCode && pendingEmailCodeExpiresAt && Date.now() <= pendingEmailCodeExpiresAt
                      ? 'bg-blue-600 active:scale-95'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  VERIFY
                </button>

                <button
                  onClick={() => {
                    setEmailCodeInput('');
                    void sendEmailVerificationCode(emailAddressInput || user.email);
                  }}
                  disabled={emailSendCooldownUntil ? Date.now() < emailSendCooldownUntil : false}
                  className={`w-full mt-3 py-3 rounded-2xl font-black text-sm transition-all border ${
                    emailSendCooldownUntil && Date.now() < emailSendCooldownUntil
                      ? 'bg-black/40 text-gray-500 border-white/10 cursor-not-allowed'
                      : 'bg-white text-black border-white/20 active:scale-95'
                  }`}
                >
                  {emailSendCooldownUntil && Date.now() < emailSendCooldownUntil
                    ? `RESEND (${Math.ceil((emailSendCooldownUntil - Date.now()) / 1000)}s)`
                    : 'RESEND CODE'}
                </button>
              </div>

              <div className="mt-6 text-center text-[10px] text-gray-500 font-bold">
                This is a simulation. In production you’d send a real email via a backend.
              </div>
            </motion.div>
          )}

          {currentScreen === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative">
              {/* Matching / Trip Request Overlay */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div 
                    initial={{ y: '100%' }} 
                    animate={{ y: 0 }} 
                    exit={{ y: '100%' }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-x-0 bottom-0 z-[200] h-[75vh] bg-black/95 text-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-t border-white/10"
                  >
                    {/* Map Preview (Simulated) */}
                    <div className="h-48 w-full relative overflow-hidden bg-gray-900">
                      <div className="absolute inset-0 opacity-30" style={{ 
                        backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px), linear-gradient(#333 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Driver to Restaurant line */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <motion.path 
                              d="M 50 150 Q 150 50 250 150" 
                              fill="none" 
                              stroke="#3b82f6" 
                              strokeWidth="4" 
                              strokeDasharray="8,8"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.path 
                              d="M 250 150 Q 350 250 450 150" 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="4" 
                              strokeDasharray="8,8"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          </svg>
                          <div className="absolute left-[50px] top-[150px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                          <div className="absolute left-[250px] top-[150px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <Coffee size={12} className="text-white" />
                          </div>
                          <div className="absolute left-[450px] top-[150px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <User size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 left-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10">
                        Trip Preview
                      </div>
                      
                      {/* Order Type and Matching Type Badges */}
                      <div className="absolute top-4 right-6 flex flex-col gap-2">
                        {pendingOrder.orderType && pendingOrder.orderType !== 'Standard' && (
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md ${
                            pendingOrder.orderType === 'Premium' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                            pendingOrder.orderType === 'Urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' :
                            pendingOrder.orderType === 'Bonus' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {pendingOrder.orderType === 'Premium' ? '🌟 Premium' :
                             pendingOrder.orderType === 'Urgent' ? '🚨 Urgent' :
                             pendingOrder.orderType === 'Bonus' ? '💰 Bonus' :
                             pendingOrder.orderType}
                          </div>
                        )}
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md ${
                          pendingOrder.matchingType === 'smart' 
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {pendingOrder.matchingType === 'smart' ? '🎯 Smart Match' : '📍 Normal Match'}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-8 flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h2 className="text-4xl font-black mb-1">£{pendingOrder.estimatedPay.toFixed(2)}</h2>
                          <p className="text-orange-400 font-black tracking-widest uppercase text-xs">Estimated Pay</p>
                          {pendingOrder.surgeMultiplier && (
                            <p className="text-orange-300 font-black text-xs mt-1">
                              <Zap size={10} className="inline mr-1" />
                              {pendingOrder.surgeMultiplier.toFixed(1)}x Surge Applied
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">{pendingOrder.estimatedTime} min</p>
                          <p className="text-orange-400 font-black tracking-widest uppercase text-xs">Est. Time</p>
                          {pendingOrder.restaurantWaitTime && (
                            <p className="text-orange-300 font-black text-xs mt-1">
                              {pendingOrder.restaurantWaitTime} min wait at restaurant
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6 mb-12">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                            <Coffee size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Pickup</p>
                            <p className="text-xl font-bold">{pendingOrder.restaurantName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Dropoff</p>
                            <p className="text-xl font-bold">{pendingOrder.customerName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-4 relative z-10">
                        <button 
                          onClick={handleAcceptOrder}
                          className="relative w-full py-6 bg-orange-500 rounded-3xl font-black text-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] active:scale-95 transition-all overflow-hidden"
                        >
                          <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 15, ease: 'linear' }}
                            className="absolute inset-0 bg-white/20"
                          />
                          <span className="relative z-10">ACCEPT TRIP • {orderExpiryTimer}s</span>
                        </button>
                        
                        <button 
                          onClick={handleDeclineOrder}
                          className="w-full py-4 bg-white/5 rounded-2xl font-black text-gray-400 active:scale-95 transition-all"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Background Mode Indicator */}
              {user.isOnline && (
                <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border ${theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Background Mode Active</span>
                </div>
              )}

              {/* Cloud Sync Status Indicator */}
              <div className={`absolute top-32 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border ${theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
                <div className={`w-2 h-2 rounded-full ${cloudStorage.isCloudSyncAvailable() ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <span className="text-[9px] font-black tracking-widest uppercase">
                  {cloudStorage.isCloudSyncAvailable() ? 'Cloud Sync' : 'Local Only'}
                </span>
              </div>

              {/* Surge Pricing Indicator */}
              {currentSurge > 1.0 && (
                <div className={`absolute top-40 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border animate-pulse ${
                  currentSurge > 1.5 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                }`}>
                  <Zap size={12} />
                  <span className="text-[9px] font-black tracking-widest uppercase">
                    Surge {currentSurge.toFixed(1)}x
                  </span>
                </div>
              )}

              {/* Map Simulation - Uber Style */}
              <div 
                onClick={() => setSelectedMarkerId(null)}
                className={`absolute inset-0 overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#1a1d21]' : 'bg-[#f8f9fa]'} ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'blur-md grayscale opacity-50 pointer-events-none' : ''}`}
              >
                {/* Uber-style map background with subtle texture */}
                <div className="absolute inset-0" style={{ 
                  background: theme === 'dark' 
                    ? 'radial-gradient(circle at 50% 50%, #2a2d34 0%, #1a1d21 100%)'
                    : 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f8f9fa 100%)'
                }} />
                
                {/* Uber-style road network */}
                <div className="absolute inset-0 opacity-60 pointer-events-none" style={{
                  background: `
                    /* Main arteries - thicker, more prominent */
                    linear-gradient(90deg, ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 2px, transparent 2px),
                    linear-gradient(0deg, ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 2px, transparent 2px),
                    /* Secondary roads */
                    linear-gradient(45deg, transparent 48%, ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} 48%, transparent 52%),
                    linear-gradient(135deg, transparent 48%, ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} 48%, transparent 52%),
                    /* Minor roads */
                    linear-gradient(90deg, transparent 49%, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 49%, transparent 51%),
                    linear-gradient(0deg, transparent 49%, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 49%, transparent 51%)
                  `,
                  backgroundSize: `${120 * mapZoom}px ${120 * mapZoom}px, ${80 * mapZoom}px ${80 * mapZoom}px, ${60 * mapZoom}px ${60 * mapZoom}px`,
                  backgroundPosition: '0 0, 40px 40px, 20px 20px',
                  transform: location ? `translate(${(location.longitude * 8000) % 120}px, ${(location.latitude * 8000) % 120}px)` : 'none'
                }} />
                
                {/* Uber-style building blocks */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                  background: `
                    /* Building clusters */
                    radial-gradient(circle at 25% 30%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 0.5%, transparent 1.5%),
                    radial-gradient(circle at 75% 25%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 0.8%, transparent 1.2%),
                    radial-gradient(circle at 45% 60%, ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 1%, transparent 2%),
                    radial-gradient(circle at 65% 45%, ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 0.7%, transparent 1.7%),
                    radial-gradient(circle at 85% 70%, ${theme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'} 0.6%, transparent 1.4%)
                  `,
                  backgroundSize: `${200 * mapZoom}px ${200 * mapZoom}px`,
                  backgroundPosition: '0 0, 100px 100px',
                  transform: location ? `translate(${(location.longitude * 4000) % 200}px, ${(location.latitude * 4000) % 200}px)` : 'none'
                }} />
                
                {/* Uber-style parks and green spaces */}
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                  background: `
                    radial-gradient(ellipse at 20% 40%, ${theme === 'dark' ? 'rgba(76,175,80,0.2)' : 'rgba(134,239,172,0.3)'} 0%, transparent 40%),
                    radial-gradient(ellipse at 70% 65%, ${theme === 'dark' ? 'rgba(76,175,80,0.15)' : 'rgba(134,239,172,0.25)'} 0%, transparent 35%),
                    radial-gradient(ellipse at 40% 80%, ${theme === 'dark' ? 'rgba(76,175,80,0.18)' : 'rgba(134,239,172,0.28)'} 0%, transparent 30%)
                  `,
                  backgroundSize: `${300 * mapZoom}px ${300 * mapZoom}px`,
                  backgroundPosition: '0 0, 150px 150px',
                  transform: location ? `translate(${(location.longitude * 2000) % 300}px, ${(location.latitude * 2000) % 300}px)` : 'none'
                }} />
                
                {/* Uber-style zoom controls */}
                <div className="absolute top-24 right-4 z-40 flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapZoom(z => Math.min(2.0, z + 0.2));
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-black text-lg font-bold flex items-center justify-center shadow-lg border border-gray-200 active:scale-95 transition-all"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapZoom(z => Math.max(0.5, z - 0.2));
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-black text-lg font-bold flex items-center justify-center shadow-lg border border-gray-200 active:scale-95 transition-all"
                  >
                    –
                  </button>
                </div>
                
                {/* Surge Areas */}
                {surgeAreas.map((area, index) => (
                  <div
                    key={index}
                    className="absolute rounded-full opacity-30 animate-pulse pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${area.multiplier > 1.5 ? 'rgba(239,68,68,0.4)' : 'rgba(251,146,60,0.4)'} 0%, transparent 70%)`,
                      width: `${area.radius * 100000 * mapZoom}px`,
                      height: `${area.radius * 100000 * mapZoom}px`,
                      left: '50%',
                      top: '50%',
                      transform: `translate(${(area.lng - location.longitude) * 5000 * mapZoom - (area.radius * 50000 * mapZoom)}px, ${(area.lat - location.latitude) * 5000 * mapZoom - (area.radius * 50000 * mapZoom)}px)`
                    }}
                  />
                ))}

                {/* Hotspots (Busy Areas) */}
                {location && hotspots.map((spot, i) => {
                  const x = (spot.longitude - location.longitude) * 50000 * mapZoom;
                  const y = (location.latitude - spot.latitude) * 50000 * mapZoom;
                  return (
                    <motion.div 
                      key={`hotspot-${i}`}
                      animate={{ 
                        scale: [1, 1.2, 1], 
                        opacity: [spot.intensity * 0.2, spot.intensity * 0.4, spot.intensity * 0.2] 
                      }}
                      transition={{ duration: 5 + i, repeat: Infinity }}
                      className="absolute rounded-full bg-orange-600 blur-[40px] pointer-events-none"
                      style={{ 
                        width: spot.size * mapZoom,
                        height: spot.size * mapZoom,
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      }}
                    />
                  );
                })}

                {/* Mock Restaurants (Busy Map) */}
                {location && MOCK_RESTAURANTS.map((rest, i) => {
                  const x = rest.offset.lng * 50000 * mapZoom;
                  const y = -rest.offset.lat * 50000 * mapZoom;
                  return (
                    <div 
                      key={`rest-${i}`}
                      className="absolute pointer-events-none flex flex-col items-center"
                      style={{ 
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      }}
                    >
                      <div className={`w-6 h-6 rounded-full border shadow-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white border-black/30' : 'bg-black border-white/30'}`}>
                        <Coffee size={12} className={`${theme === 'dark' ? 'text-black' : 'text-white'}`} />
                      </div>
                      <span className={`text-[8px] font-black mt-1 px-1 rounded ${theme === 'dark' ? 'bg-black/70 text-white/90' : 'bg-white/90 text-black/80'}`}>
                        {rest.name}
                      </span>
                    </div>
                  );
                })}

                {/* Simulated Street Labels */}
                <div className="absolute inset-0 pointer-events-none opacity-35 overflow-hidden">
                  {[
                    { name: "High St", x: 100, y: 200 },
                    { name: "London Rd", x: 400, y: 500 },
                    { name: "Park Ave", x: 700, y: 100 },
                    { name: "Station Way", x: 200, y: 800 },
                    { name: "Broadway", x: 600, y: 400 },
                  ].map((label, i) => (
                    <div 
                      key={i}
                      className={`absolute text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap ${theme === 'dark' ? 'text-white/35' : 'text-black/35'}`}
                      style={{
                        left: label.x,
                        top: label.y,
                        transform: location
                          ? `translate(${((location.longitude * 10000) % 1000) * mapZoom}px, ${((location.latitude * 10000) % 1000) * mapZoom}px)`
                          : 'none'
                      }}
                    >
                      {label.name}
                    </div>
                  ))}
                </div>

                {location && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Pulsing blue dot for driver */}
                    <div className="relative z-10">
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] flex items-center justify-center">
                        <Navigation size={16} className="text-white fill-white" style={{ transform: 'rotate(45deg)' }} />
                      </div>
                      <div className="absolute -inset-6 bg-blue-500/30 rounded-full animate-ping" />
                      {pendingOrder && (
                        <motion.div 
                          animate={{ scale: [1, 4], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-blue-400 rounded-full"
                        />
                      )}
                    </div>

                    {/* Restaurant and Customer markers */}
                    {activeOrders.map(order => {
                      const isPickup = order.status === 'accepted';
                      const target = isPickup ? order.restaurantLocation : order.customerLocation;
                      const x = (target.longitude - location.longitude) * 50000 * mapZoom;
                      const y = (location.latitude - target.latitude) * 50000 * mapZoom;
                      const isSelected = selectedMarkerId === order.id;
                      
                      return (
                        <div 
                          key={order.id} 
                          className="absolute transition-transform duration-1000 pointer-events-auto cursor-pointer" 
                          style={{ transform: `translate(${x}px, ${y}px)`, zIndex: isSelected ? 100 : 10 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMarkerId(isSelected ? null : order.id);
                          }}
                        >
                          {isSelected && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white p-2 rounded-lg shadow-2xl border border-white/20 min-w-[120px] z-50"
                            >
                              <div className="text-[10px] font-black uppercase text-blue-400 mb-1">
                                {isPickup ? 'Pickup' : 'Dropoff'}
                              </div>
                              <div className="text-xs font-bold leading-tight mb-1">
                                {isPickup ? order.restaurantName : order.customerName}
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  <Navigation size={10} />
                                  {distanceToTarget(order)} mi
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  <Clock size={10} />
                                  {Math.floor(parseFloat(distanceToTarget(order)) * 5 + 2)} min
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                            </motion.div>
                          )}
                          <div className={`p-2 rounded-full border-2 border-white shadow-xl transition-transform ${isSelected ? 'scale-125' : ''} ${isPickup ? 'bg-green-500' : 'bg-blue-600'}`}>
                            {isPickup ? <Coffee size={16} className="text-white" /> : <User size={16} className="text-white" />}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-white whitespace-nowrap">
                            {isPickup ? order.restaurantName : order.customerName}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pending Order Marker (Matching) */}
                    {pendingOrder && (
                      <>
                        {[pendingOrder.restaurantLocation, pendingOrder.customerLocation].map((target, i) => {
                          const x = (target.longitude - location.longitude) * 50000 * mapZoom;
                          const y = (location.latitude - target.latitude) * 50000 * mapZoom;
                          return (
                            <motion.div 
                              key={`pending-${i}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute transition-transform duration-1000 pointer-events-none" 
                              style={{ transform: `translate(${x}px, ${y}px)`, zIndex: 150 }}
                            >
                              <div className="p-2 rounded-full border-2 border-white shadow-xl bg-orange-500 animate-pulse">
                                {i === 0 ? <Coffee size={16} className="text-white" /> : <User size={16} className="text-white" />}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-orange-600 px-2 py-1 rounded text-[8px] font-black text-white whitespace-nowrap shadow-lg">
                                {i === 0 ? 'PICKUP MATCH' : 'DROPOFF MATCH'}
                              </div>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Top Controls */}
              {!user.isOnline && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
                  <button onClick={() => setIsSideMenuOpen(true)} className={`p-3 rounded-full shadow-xl active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    <Menu size={24} />
                  </button>
                  
                  <motion.button 
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    onClick={() => setCurrentScreen('earnings')}
                    className="bg-black text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 active:scale-95 transition-transform"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-black text-xs">£</span>
                    </div>
                    <span className="text-xl font-black">{earnings.toFixed(2)}</span>
                  </motion.button>

                  <div className="flex items-center gap-2">
                    <button className={`p-3 rounded-full shadow-xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      <Search size={24} />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Menu Toggle Button / Map Status Bar */}
              {!pendingOrder && !isBottomMenuOpen && (
                <div className="absolute bottom-8 left-4 right-4 z-50">
                  {user.isOnline ? (
                    <motion.button
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsBottomMenuOpen(true)}
                      className="bg-black text-white px-3 py-2 rounded-full font-black text-sm shadow-2xl flex items-center gap-2 border border-white/10"
                    >
                      <Menu size={24} />
                      <span>Go Online</span>
                    </motion.button>
                  ) : (
                    /* Offline - Full menu */
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsBottomMenuOpen(true)}
                      className="bg-black text-white px-8 py-4 rounded-full font-black text-lg shadow-2xl flex items-center gap-3 border border-white/10"
                    >
                      <Menu size={24} />
                      <span>Go Online</span>
                    </motion.div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {isBottomMenuOpen && (
                  <div className="absolute inset-0 z-[150]">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/95"
                    >
                      <div className="overflow-y-auto px-6 pb-12 custom-scrollbar flex-1">
                        {!user.isOnline ? (
                          <>
                            <div className="flex justify-between w-full mb-8 px-4">
                              <button onClick={() => { setIsSideMenuOpen(true); setIsBottomMenuOpen(false); }} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Menu size={24} /></div>
                                <span className="text-xs font-bold">Menu</span>
                              </button>
                              
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                disabled={(lockoutUntil ? Date.now() < lockoutUntil : false) || Object.values(customerTimers).some(t => Number(t) > 0)}
                                onClick={() => {
                                  if (user.faceVerified) {
                                    // If you're on a "new phone/device", require email verification first
                                    if (!isEmailVerifiedForThisDevice) {
                                      setEmailVerifyRequestedForOnline(true);
                                      setIsBottomMenuOpen(false);
                                      setCurrentScreen('email_verification');
                                        void sendEmailVerificationCode(emailAddressInput || user.email);
                                      return;
                                    }

                                    setUser(u => ({ ...u, isOnline: true }));
                                    setIsBottomMenuOpen(false);
                                    playUberSound('accept');
                                  } else {
                                    setIsVerifyingToOnline(true);
                                    playUberSound('order');
                                    setCurrentScreen('face_verification');
                                    setIsBottomMenuOpen(false);
                                  }
                                }}
                                className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] relative overflow-hidden transition-all -mt-16 ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'bg-gray-800 grayscale cursor-not-allowed' : 'bg-blue-600'}`}
                              >
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} 
                                  transition={{ duration: 2, repeat: Infinity }} 
                                  className="absolute inset-0 bg-white rounded-full" 
                                />
                                <span className="text-xl font-black tracking-widest relative z-10 text-white">{(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'LOCKED' : 'GO'}</span>
                              </motion.button>

                              <button className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Search size={24} /></div>
                                <span className="text-xs font-bold">Search</span>
                              </button>
                            </div>

                            <div className={`w-full p-4 rounded-2xl flex items-center justify-between mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="font-bold text-sm">You're offline</span>
                              </div>
                              <span className="text-xs text-gray-400 font-bold">{currentCity}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between w-full mb-8 px-4">
                              <button onClick={() => { setIsSideMenuOpen(true); setIsBottomMenuOpen(false); }} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Menu size={24} /></div>
                                <span className="text-xs font-bold">Menu</span>
                              </button>
                              
                              <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                  <motion.div 
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-blue-500 rounded-full"
                                  />
                                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                                    <Navigation size={32} className="animate-pulse" />
                                  </div>
                                </div>
                                <span className="text-sm font-black text-blue-600">FINDING TRIPS</span>
                              </div>

                              <button className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Search size={24} /></div>
                                <span className="text-xs font-bold">Search</span>
                              </button>
                            </div>

                            <div className={`w-full p-4 rounded-2xl flex items-center justify-between mb-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                              <div className="flex items-center gap-3">
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="w-2 h-2 bg-blue-500 rounded-full" 
                                />
                                <span className={`font-black text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Finding trips in {currentCity}...</span>
                              </div>
                              <button 
                                onClick={() => { setUser(u => ({ ...u, isOnline: false, faceVerified: false })); setIsBottomMenuOpen(false); }} 
                                className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}
                              >
                                OFFLINE
                              </button>
                            </div>
                          </>
                        )}

                        {/* Common scrollable items */}
                        <div className="space-y-3">
                          <div className={`p-4 rounded-2xl flex items-center gap-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="p-2 bg-blue-600 text-white rounded-lg"><ShieldCheck size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Safety Toolkit</p>
                              <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Access emergency tools</p>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><Gift size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Promotions</p>
                              <p className="text-[10px] text-gray-400 font-bold">Earn extra £2.00 per trip</p>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><Star size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Uber Pro</p>
                              <p className="text-[10px] text-gray-400 font-bold">Gold status active</p>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><TrendingUp size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Earnings Trend</p>
                              <p className="text-[10px] text-gray-400 font-bold">Busy area nearby</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Bottom Cards */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <AnimatePresence>
                  {user.isOnline && activeOrders.length === 0 && (
                    <motion.div 
                      initial={{ y: 200 }} 
                      animate={{ y: 0 }} 
                      exit={{ y: 200 }} 
                      className="bg-white text-black rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col max-h-[45vh] overflow-hidden"
                    >
                      <div className="flex flex-col items-center pt-4 pb-2">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-4" />
                      </div>
                      
                      <div className="overflow-y-auto px-6 pb-8 custom-scrollbar">
                        <div className="flex justify-between w-full mb-6 px-4">
                          <button onClick={() => setIsSideMenuOpen(true)} className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-gray-100 rounded-full"><Menu size={24} /></div>
                            <span className="text-xs font-bold">Menu</span>
                          </button>
                          
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                              <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-blue-500 rounded-full"
                              />
                              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                                <Navigation size={32} className="animate-pulse" />
                              </div>
                            </div>
                            <span className="text-sm font-black text-blue-600">FINDING TRIPS</span>
                          </div>

                          <button className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-gray-100 rounded-full"><Search size={24} /></div>
                            <span className="text-xs font-bold">Search</span>
                          </button>
                        </div>

                        <div className={`w-full p-4 rounded-2xl flex items-center justify-between mb-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                          <div className="flex items-center gap-3">
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-2 h-2 bg-blue-500 rounded-full" 
                            />
                            <span className={`font-black text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Finding trips in {currentCity}...</span>
                          </div>
                          <button 
                            onClick={() => setUser(u => ({ ...u, isOnline: false, faceVerified: false }))} 
                            className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}
                          >
                            OFFLINE
                          </button>
                        </div>

                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                          <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-full w-1/3 bg-blue-500" />
                        </div>

                        {/* Extra scrollable items */}
                        <div className="space-y-3">
                          <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
                              <div>
                                <p className="text-sm font-black">Earnings Trend</p>
                                <p className="text-[10px] text-gray-400 font-bold">Busy area nearby</p>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-300" />
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Star size={20} /></div>
                              <div>
                                <p className="text-sm font-black">Uber Pro</p>
                                <p className="text-[10px] text-gray-400 font-bold">Gold status active</p>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeOrders.map((order, idx) => (
                    <motion.div key={order.id} initial={{ y: 100 }} animate={{ y: 0 }} className="bg-white text-black rounded-2xl shadow-2xl overflow-hidden mb-2">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                          <Navigation size={18} />
                          <span>{order.status === 'accepted' ? `Pickup: ${order.restaurantName}` : `Dropoff: ${order.customerName}`}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-400">{distanceToTarget(order)} mi</div>
                      </div>
                      
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {order.status === 'accepted' ? <Coffee size={24} /> : <User size={24} />}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-tight">{order.status === 'accepted' ? order.restaurantName : order.customerName}</h3>
                            <p className="text-sm text-gray-500">{order.items.length} items • £{order.estimatedPay.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'returning_to_restaurant' ? (
                            <button 
                              onClick={() => {
                                setActiveOrders(prev => prev.filter(o => o.id !== order.id));
                                sendNotification("Order Returned", `Order from ${order.restaurantName} returned successfully.`);
                              }}
                              className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-transform"
                            >
                              RETURNED
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => setCancellingOrderId(order.id)} 
                                className={`w-12 h-12 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-red-500' : 'bg-gray-50 border-gray-100 text-red-600'}`}
                              >
                                <X size={24} />
                              </button>
                              <button onClick={() => { setActiveChatOrderId(order.id); setCurrentScreen('chat'); }} className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-100 text-black'}`}>
                                <MessageSquare size={24} />
                              </button>
                              <button onClick={() => handleNextStep(order.id)} className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                <ArrowRight size={24} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Cancel Trip Modal */}
              <AnimatePresence>
                {cancellingOrderId && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }} 
                      animate={{ scale: 1, y: 0 }} 
                      exit={{ scale: 0.9, y: 20 }} 
                      className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                    >
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <X size={32} strokeWidth={3} />
                      </div>
                      <h2 className="text-2xl font-black text-center mb-2">Cancel Trip?</h2>
                      <p className="text-center text-gray-400 font-bold mb-8">Cancelling may affect your Gold status and points.</p>
                      
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleCancelOrder(cancellingOrderId)}
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform"
                        >
                          YES, CANCEL
                        </button>
                        <button 
                          onClick={() => setCancellingOrderId(null)}
                          className={`w-full py-4 rounded-2xl font-black text-lg active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-100 text-black'}`}
                        >
                          KEEP TRIP
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delivery Verification Modal */}
              <AnimatePresence>
                {verifyingDeliveryId && <DeliveryVerificationModal />}
              </AnimatePresence>

              {/* Earnings Detail Modal */}
              <AnimatePresence>
                {currentScreen === 'earnings_detail' && <EarningsDetail />}
              </AnimatePresence>

              {/* Pending Order Modal */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} className="absolute inset-x-4 bottom-24 z-[60]">
                    <div className="bg-white text-black rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      <div className="bg-blue-600 p-6 text-white text-center relative">
                        <div className="text-sm font-bold tracking-widest opacity-80 mb-1 uppercase">New Delivery Opportunity</div>
                        <div className="text-4xl font-black">£{pendingOrder.estimatedPay.toFixed(2)}</div>
                        <div className="text-sm font-bold opacity-80 mt-1">Includes expected tip</div>
                        <div className="mt-4 flex justify-center">
                          <div className="w-12 h-12 rounded-full border-4 border-white/30 flex items-center justify-center relative">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle 
                                cx="24" cy="24" r="20" 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="4" 
                                strokeDasharray="125.6" 
                                strokeDashoffset={125.6 * (1 - orderExpiryTimer / 10)}
                                className="transition-all duration-1000 ease-linear"
                              />
                            </svg>
                            <span className="font-black text-lg">{orderExpiryTimer}</span>
                          </div>
                        </div>
                        <button onClick={handleDeclineOrder} className="absolute top-4 right-4 p-1 bg-black/20 rounded-full"><X size={20} /></button>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <div className="w-0.5 h-6 bg-gray-200" />
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg mb-4">{pendingOrder.restaurantName}</div>
                            <div className="font-bold text-lg text-gray-400">Customer Address</div>
                          </div>
                        </div>
                        <button onClick={handleAcceptOrder} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl tracking-wide">ACCEPT</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentScreen === 'chat' && (
            <motion.div key="chat" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="h-full w-full bg-white text-black flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <div className="flex-1">
                  <h2 className="font-black text-xl">Chat with Customer</h2>
                  <p className="text-xs text-gray-400 font-bold">Order #{activeChatOrderId?.substr(0, 5)}</p>
                </div>
                <button className="p-3 bg-green-500 text-white rounded-full"><Phone size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.filter(m => m.orderId === activeChatOrderId).map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl font-bold ${msg.sender === 'driver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {customerTimers[activeChatOrderId!] !== undefined && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-black border border-red-100">
                      CUSTOMER RESPONSE TIMER: {Math.floor(customerTimers[activeChatOrderId!] / 60)}:{(customerTimers[activeChatOrderId!] % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  "I've arrived",
                  "I'm outside",
                  "I'm at the door",
                  "What's the PIN?",
                  "Can't find you",
                  "Be there in 2 minutes",
                  "Traffic is a bit slow",
                  "Please come to the main entrance",
                ].map(text => (
                  <button 
                    key={text}
                    onClick={() => {
                      setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'driver', text, timestamp: Date.now() }]);
                      setCustomerTimers(prev => ({ ...prev, [activeChatOrderId!]: 300 })); // Start 5 min timer
                      // Simulate customer reply
                      setTimeout(() => {
                        const order = activeOrders.find(o => o.id === activeChatOrderId);
                        let reply = "Coming now!";
                        if (text.toLowerCase().includes('pin')) {
                          reply = `My PIN is ${order?.pin || '1234'}.`;
                        }
                        setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'customer', text: reply, timestamp: Date.now() }]);
                        playUberSound('message');
                        setCustomerTimers(prev => {
                          const next = { ...prev };
                          delete next[activeChatOrderId!]; // Stop timer on reply
                          return next;
                        });
                      }, 5000);
                    }}
                    className="whitespace-nowrap px-4 py-2 bg-gray-100 rounded-full text-xs font-bold hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-100 rounded-full px-6 py-3 font-bold outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const text = e.currentTarget.value;
                      setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'driver', text, timestamp: Date.now() }]);
                      e.currentTarget.value = '';
                      // Simulate customer reply
                      setTimeout(() => {
                        const order = activeOrders.find(o => o.id === activeChatOrderId);
                        let reply = "Thanks! See you soon.";
                        if (text.toLowerCase().includes('pin') || text.toLowerCase().includes('code')) {
                          reply = `Sure, my delivery PIN is ${order?.pin || '1234'}.`;
                        }
                        setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'customer', text: reply, timestamp: Date.now() }]);
                        sendNotification("New Message", `Customer: ${reply}`);
                        playUberSound('message');
                      }, 2000);
                    }
                  }}
                />
                <button className="p-4 bg-black text-white rounded-full"><Send size={20} /></button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'uber_pro' && (
            <motion.div key="pro" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Uber Pro</h1>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white mb-8">
                <p className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest">{user.tier} Tier</p>
                <h2 className="text-4xl font-black mb-6">{user.points} Points</h2>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-white" style={{ width: `${(user.points / 500) * 100}%` }} />
                </div>
                <p className="text-sm font-bold opacity-80">380 points to Gold</p>
              </div>
              <div className="space-y-6">
                <h3 className="font-black text-xl">Your Rewards</h3>
                {[
                  { title: "Fuel Discount", desc: "Save 3p/litre at BP", icon: <Zap /> },
                  { title: "Free Coffee", desc: "Weekly Costa reward", icon: <Coffee /> },
                  { title: "Priority Support", desc: "Fast-track help", icon: <HelpCircle /> },
                ].map((reward, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">{reward.icon}</div>
                    <div>
                      <p className="font-black">{reward.title}</p>
                      <p className="text-sm text-gray-400 font-bold">{reward.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'wallet' && (
            <motion.div key="wallet" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Wallet</h1>
              </div>
              <div className="bg-gray-100 rounded-3xl p-8 mb-6">
                <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Balance</p>
                <h2 className="text-5xl font-black">£{earnings.toFixed(2)}</h2>
                <button 
                  onClick={() => {
                    if (earnings > 0) {
                      setBankBalance(prev => prev + earnings);
                      setEarnings(0);
                      sendNotification("Cash Out Successful", "£" + earnings.toFixed(2) + " has been sent to your bank account.");
                      setCurrentScreen('banking');
                    }
                  }}
                  className="mt-6 w-full py-4 bg-black text-white rounded-2xl font-black active:scale-95 transition-transform"
                >
                  CASH OUT
                </button>
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-xl">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <CreditCard className="text-blue-600" />
                    <span className="font-bold">•••• 4242</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Default</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'opportunities' && (
            <motion.div key="opps" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Opportunities</h1>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100">
                  <div className="flex items-center gap-3 mb-2 text-blue-600">
                    <TrendingUp size={20} />
                    <span className="font-black">1.5x Surge</span>
                  </div>
                  <p className="font-bold text-lg">Central London is busy right now.</p>
                  <p className="text-sm text-gray-500 font-bold mt-1">Expected earnings are higher than usual.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl">
                  <div className="flex items-center gap-3 mb-2 text-green-600">
                    <Gift size={20} />
                    <span className="font-black">Quest: £20 Bonus</span>
                  </div>
                  <p className="font-bold">Complete 10 more trips today.</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '80%' }} />
                  </div>
                  <p className="text-xs text-gray-400 font-bold mt-2">8/10 completed</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'inbox' && (
            <motion.div key="inbox" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Inbox</h1>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold">No new messages</div>
                ) : (
                  notifications.map((note, i) => (
                    <div key={i} className="p-4 border-b border-gray-100 flex gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0"><Bell size={24} /></div>
                      <div>
                        <p className="font-bold">{note}</p>
                        <p className="text-xs text-gray-400 font-bold mt-1">Just now</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {currentScreen === 'safety' && (
            <motion.div key="safety" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="h-full w-full bg-white text-black p-6">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Safety Toolkit</h1>
              </div>
              <div className="space-y-4">
                <button className="w-full p-6 bg-red-50 text-red-600 rounded-3xl flex items-center gap-4 font-black text-xl">
                  <div className="p-3 bg-red-600 text-white rounded-full"><Phone size={24} /></div>
                  Emergency Assistance
                </button>
                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <h3 className="font-black text-lg">Safety Features</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Share Trip Status</span>
                    <ArrowRight size={20} className="text-gray-300" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">RideCheck</span>
                    <ArrowRight size={20} className="text-gray-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'banking' && (
            <motion.div key="banking" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="h-full w-full bg-[#f4f7f6] text-black p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <CreditCard size={24} />
                  </div>
                  <h1 className="text-2xl font-black text-blue-900">Monzo Clone</h1>
                </div>
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
              </div>

              <div className="bg-white rounded-[32px] p-8 shadow-sm mb-8">
                <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Main Account</p>
                <h2 className="text-5xl font-black text-blue-900">£{bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                <div className="flex gap-4 mt-6">
                  <button className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">Add Money</button>
                  <button className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">Transfer</button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xl text-blue-900">Spend Your Earnings</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{purchasedItems.length} Items Owned</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'coffee', name: 'Premium Coffee', price: 3.50, icon: <Coffee /> },
                    { id: 'jacket', name: 'Uber Eats Jacket', price: 45.00, icon: <Zap /> },
                    { id: 'ebike', name: 'Electric Delivery Bike', price: 1200.00, icon: <Zap /> },
                    { id: 'iphone', name: 'iPhone 15 Pro', price: 999.00, icon: <Smartphone /> },
                    { id: 'tesla', name: 'Tesla Model 3', price: 35000.00, icon: <Zap /> },
                  ].map((item) => {
                    const isOwned = purchasedItems.includes(item.id);
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-black text-blue-900">{item.name}</p>
                            <p className="text-sm text-gray-400 font-bold">£{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <button 
                          disabled={isOwned || bankBalance < item.price}
                          onClick={() => {
                            if (bankBalance >= item.price) {
                              setBankBalance(prev => prev - item.price);
                              setPurchasedItems(prev => [...prev, item.id]);
                              sendNotification("Purchase Successful", `You bought a ${item.name}!`);
                            }
                          }}
                          className={`px-6 py-2 rounded-full font-black text-sm transition-all ${isOwned ? 'bg-green-100 text-green-600' : bankBalance < item.price ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white active:scale-95'}`}
                        >
                          {isOwned ? 'OWNED' : 'BUY'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {purchasedItems.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-black text-xl text-blue-900 mb-4">Your Collection</h3>
                    <div className="flex flex-wrap gap-2">
                      {purchasedItems.map(id => (
                        <span key={id} className="px-4 py-2 bg-white rounded-full text-xs font-black text-blue-900 shadow-sm border border-blue-50 uppercase tracking-widest">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentScreen === 'account' && (
            <motion.div key="account" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Account</h1>
              </div>
              <div className="flex flex-col items-center mb-8">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-xl mb-4 ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}>
                  <img src={user.profilePic || "https://picsum.photos/seed/driver/200/200"} alt="Me" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-black">{user.name}</h2>
                <p className="text-sm font-bold text-gray-400">London • Gold Partner</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: <User />, label: "Personal Information", action: () => sendNotification("Account", "Personal info updated.") },
                  { icon: <FileText />, label: "Documents", action: () => setCurrentScreen('documents') },
                  { icon: <CreditCard />, label: "Payment", action: () => setCurrentScreen('earnings') },
                  { icon: <Settings />, label: "App Settings", action: () => sendNotification("Settings", "Settings updated.") },
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400">{item.icon}</div>
                      <span className="font-bold">{item.label}</span>
                    </div>
                    <ArrowRight size={20} className="text-gray-300" />
                  </button>
                ))}
                
                <div className={`p-4 rounded-2xl mt-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-blue-500"><Moon size={24} /></div>
                      <div>
                        <p className="font-bold">Dark Mode</p>
                        <p className="text-xs text-gray-400 font-bold">Switch app theme</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      className={`w-12 h-6 rounded-full relative p-1 transition-colors cursor-pointer ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <motion.div 
                        animate={{ x: theme === 'dark' ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl mt-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-blue-500"><Navigation size={24} /></div>
                      <div>
                        <p className="font-bold">Simulate Movement</p>
                        <p className="text-xs text-gray-400 font-bold">Test map movement without moving</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
                      className={`w-12 h-6 rounded-full relative p-1 transition-colors cursor-pointer ${isSimulatingMovement ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <motion.div 
                        animate={{ x: isSimulatingMovement ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-4 p-4 text-red-600 font-black mt-4 bg-red-50 rounded-2xl border border-red-100 active:scale-95 transition-transform"
                >
                  <RefreshCw size={24} />
                  <span>RESET APP & DATA</span>
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'earnings' && (
            <motion.div key="earnings" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Earnings</h1>
              </div>

              {/* Tabs */}
              <div className={`flex p-1 rounded-2xl mb-8 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                {(['today', 'weekly', 'recent'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEarningsTab(tab)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      earningsTab === tab 
                        ? (theme === 'dark' ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg')
                        : 'text-gray-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-black text-white'} rounded-3xl p-8 mb-8 relative overflow-hidden`}>
                <p className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest">
                  {earningsTab === 'today' ? 'Today' : earningsTab === 'weekly' ? 'This Week' : 'Total Earnings'}
                </p>
                <h2 className="text-5xl font-black mb-6">£{(earningsTab === 'today' ? earnings * 0.15 : earnings).toFixed(2)}</h2>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Trips</p>
                    <p className="text-xl font-black">{earningsTab === 'today' ? 2 : user.deliveries}</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Online</p>
                    <p className="text-xl font-black">{earningsTab === 'today' ? '1h 15m' : '4h 22m'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-black text-xl">
                  {earningsTab === 'recent' ? 'All Activity' : 'Recent Activity'}
                </h3>
                {(earningsTab === 'today' ? [1, 2] : [1, 2, 3, 4, 5]).map(i => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-green-500 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Check size={24} /></div>
                      <div>
                        <p className="font-bold">Delivery • {['Greggs', 'McDonald\'s', 'Subway', 'KFC', 'Burger King'][i % 5]}</p>
                        <p className="text-xs text-gray-400">{earningsTab === 'today' ? 'Today' : 'Yesterday'}, {2 + i}:45 PM</p>
                      </div>
                    </div>
                    <p className="font-black text-lg">£{(5 + Math.random() * 5).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'heatmap' && (
            <motion.div key="heatmap" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Earnings Heatmap</h1>
              </div>

              <div className={`rounded-3xl p-6 mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black">{currentCity}</h2>
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} />
                    <span className="text-sm font-bold">{weather.temperature}°C</span>
                    <Cloud size={16} />
                    <span className="text-sm font-bold capitalize">{weather.condition.replace('_', ' ')}</span>
                  </div>
                </div>
                
                {/* Simulated Heatmap */}
                <div className="relative h-64 bg-gradient-to-br from-green-500/20 via-yellow-500/30 to-red-500/40 rounded-2xl mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Map size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-bold opacity-70">Live Earnings Hotspots</p>
                    </div>
                  </div>
                  
                  {/* Hotspot indicators */}
                  {hotspots.map((hotspot, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full animate-pulse"
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${15 + (i * 12)}%`,
                        width: `${hotspot.size / 10}px`,
                        height: `${hotspot.size / 10}px`,
                        backgroundColor: hotspot.intensity > 0.6 ? 'rgba(239, 68, 68, 0.6)' : hotspot.intensity > 0.3 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(34, 197, 94, 0.6)',
                        filter: 'blur(8px)'
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-bold">Low demand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-bold">Medium demand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-bold">High demand</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl p-6 mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className="font-black text-xl mb-4">Peak Hours Today</h3>
                <div className="space-y-3">
                  {[
                    { time: '12:00 PM - 2:00 PM', multiplier: 1.5, status: 'active' },
                    { time: '6:00 PM - 8:00 PM', multiplier: 2.0, status: 'upcoming' },
                    { time: '9:00 PM - 11:00 PM', multiplier: 1.8, status: 'upcoming' }
                  ].map((peak, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${peak.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <div>
                          <p className="font-bold">{peak.time}</p>
                          <p className="text-xs text-gray-400">{peak.multiplier}x multiplier</p>
                        </div>
                      </div>
                      {peak.status === 'active' && (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-black rounded-full">ACTIVE</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className="font-black text-xl mb-4">Earnings Insights</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <p className="text-2xl font-black">£{earningsData.reduce((sum, d) => sum + d.earnings, 0).toFixed(0)}</p>
                    <p className="text-xs text-gray-400">This week</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <p className="text-2xl font-black">{earningsData.reduce((sum, d) => sum + d.orders, 0)}</p>
                    <p className="text-xs text-gray-400">Total deliveries</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'referrals' && (
            <motion.div key="referrals" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Referral Program</h1>
              </div>

              <div className={`rounded-3xl p-6 mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h2 className="text-xl font-black mb-4">Your Invite Code</h2>
                <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} border-2 border-dashed ${theme === 'dark' ? 'border-white/20' : 'border-gray-300'}`}>
                  <div className="text-center">
                    <p className="text-3xl font-black mb-2">{user.name.replace(/\s+/g, '').toUpperCase()}123</p>
                    <p className="text-sm text-gray-400 mb-4">Share this code with new drivers</p>
                    <button className="px-6 py-3 bg-black text-white rounded-2xl font-black text-sm active:scale-95 transition-transform">
                      <Share2 size={16} className="inline mr-2" />
                      Share Code
                    </button>
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl p-6 mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className="font-black text-xl mb-4">Referral Benefits</h3>
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Gift size={20} className="text-green-500" />
                      <span className="font-black">New Driver Bonus</span>
                    </div>
                    <p className="text-sm text-gray-400">£100 bonus for you, £100 for your referral</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Star size={20} className="text-yellow-500" />
                      <span className="font-black">Tier Benefits</span>
                    </div>
                    <p className="text-sm text-gray-400">Referrals count toward Uber Pro tier progression</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className="font-black text-xl mb-4">Your Referrals</h3>
                {referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 font-bold">No referrals yet</p>
                    <p className="text-sm text-gray-400">Start sharing your code to earn bonuses!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div key={referral.id} className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{referral.referredDriverName}</p>
                            <p className="text-xs text-gray-400">{referral.referredDriverEmail}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-black rounded-full ${
                              referral.status === 'completed' ? 'bg-green-500 text-white' :
                              referral.status === 'pending' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {referral.status.toUpperCase()}
                            </span>
                            <p className="text-sm font-black mt-1">£{referral.bonusAmount}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentScreen === 'vehicles' && (
            <motion.div key="vehicles" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">My Vehicles</h1>
              </div>

              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} ${vehicle.isPrimary ? 'border-2 border-green-500' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                          {vehicle.type === 'car' ? <Car size={24} /> : vehicle.type === 'bike' ? <Bike size={24} /> : <Truck size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-lg">{vehicle.make} {vehicle.model}</p>
                            {vehicle.isPrimary && <span className="px-2 py-1 bg-green-500 text-white text-xs font-black rounded-full">PRIMARY</span>}
                          </div>
                          <p className="text-sm text-gray-400">{vehicle.year} • {vehicle.licensePlate}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (!vehicle.isPrimary) {
                            setVehicles(prev => prev.map(v => ({ ...v, isPrimary: v.id === vehicle.id })));
                          }
                        }}
                        className={`px-4 py-2 rounded-2xl font-black text-sm transition-colors ${
                          vehicle.isPrimary ? 'bg-green-500 text-white' : theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-black'
                        }`}
                      >
                        {vehicle.isPrimary ? 'In Use' : 'Set Primary'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                        <p className="text-xs text-gray-400 mb-1">Insurance</p>
                        <p className="font-bold text-sm">
                          {vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString() : 'Not added'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                        <p className="text-xs text-gray-400 mb-1">Registration</p>
                        <p className="font-bold text-sm">
                          {vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry).toLocaleDateString() : 'Not added'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <button className={`w-full p-6 rounded-3xl border-2 border-dashed ${theme === 'dark' ? 'border-white/20' : 'border-gray-300'} flex items-center justify-center gap-4 transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <Plus size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black">Add Vehicle</p>
                    <p className="text-sm text-gray-400">Add another vehicle to your account</p>
                  </div>
                </button>
              </div>

              <div className={`rounded-3xl p-6 mt-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className="font-black text-xl mb-4">Vehicle Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Miles Driven</span>
                    <span className="font-black">1,247 miles</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fuel Efficiency</span>
                    <span className="font-black">32.5 MPG</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Maintenance</span>
                    <span className="font-black">2 weeks ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'emergency' && (
            <motion.div key="emergency" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black text-red-500">Emergency</h1>
              </div>

              <div className="space-y-4">
                {/* SOS Button */}
                <button className="w-full p-8 bg-red-500 text-white rounded-3xl animate-pulse">
                  <PhoneCall size={48} className="mx-auto mb-4" />
                  <p className="text-2xl font-black">SOS</p>
                  <p className="text-sm opacity-90">Press and hold for 3 seconds</p>
                </button>

                {/* Emergency Contacts */}
                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h3 className="font-black text-xl mb-4">Emergency Contacts</h3>
                  <div className="space-y-3">
                    {emergencyContacts.map((contact) => (
                      <div key={contact.id} className={`flex items-center justify-between p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contact.isPrimary ? 'bg-red-500 text-white' : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <Phone size={20} />
                          </div>
                          <div>
                            <p className="font-bold">{contact.name}</p>
                            <p className="text-xs text-gray-400">{contact.relationship}</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-red-500 text-white rounded-2xl font-black text-sm">
                          Call
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Features */}
                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h3 className="font-black text-xl mb-4">Safety Features</h3>
                  <div className="space-y-3">
                    <button className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={20} className="text-blue-500" />
                        <span className="font-bold">Share Trip Status</span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                    <button className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-green-500" />
                        <span className="font-bold">Live Location Sharing</span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                    <button className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-yellow-500" />
                        <span className="font-bold">Report Incident</span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Emergency Tips */}
                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h3 className="font-black text-xl mb-4">Emergency Tips</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      Always keep your phone charged and accessible
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      Trust your instincts - if a situation feels unsafe, leave
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      Park in well-lit areas and lock your vehicle
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'analytics' && (
            <motion.div key="analytics" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Analytics</h1>
              </div>

              <div className="space-y-6">
                {/* Performance Overview */}
                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h3 className="font-black text-xl mb-4">Performance Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-500" />
                        <span className="text-xs text-gray-400">Avg. Hourly</span>
                      </div>
                      <p className="text-2xl font-black">£18.50</p>
                      <p className="text-xs text-green-500">+12% vs last week</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={16} className="text-yellow-500" />
                        <span className="text-xs text-gray-400">Rating</span>
                      </div>
                      <p className="text-2xl font-black">{user.rating.toFixed(2)}</p>
                      <p className="text-xs text-green-500">+0.03 this week</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-blue-500" />
                        <span className="text-xs text-gray-400">Avg. Time</span>
                      </div>
                      <p className="text-2xl font-black">28m</p>
                      <p className="text-xs text-green-500">-3m faster</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-purple-500" />
                        <span className="text-xs text-gray-400">Accept Rate</span>
                      </div>
                      <p className="text-2xl font-black">87%</p>
                      <p className="text-xs text-green-500">+5% this week</p>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h3 className="font-black text-xl mb-4">AI Insights</h3>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            suggestion.priority === 'high' ? 'bg-red-500' :
                            suggestion.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          } text-white`}>
                            <Zap size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{suggestion.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-400">Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                              {suggestion.potentialSavings && (
                                <span className="text-xs text-green-500">+£{suggestion.potentialSavings}/hr</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievement Progress */}
                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h3 className="font-black text-xl mb-4">Achievement Progress</h3>
                  <div className="space-y-3">
                    {achievements.filter(a => !a.unlockedAt).map((achievement) => (
                      <div key={achievement.id} className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{achievement.icon}</span>
                            <span className="font-bold text-sm">{achievement.title}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            achievement.rarity === 'legendary' ? 'bg-purple-500 text-white' :
                            achievement.rarity === 'epic' ? 'bg-blue-500 text-white' :
                            achievement.rarity === 'rare' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{achievement.progress}/{achievement.maxProgress}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="h-20 bg-black border-t border-white/10 flex items-center justify-around px-4 z-[110]">
        <NavButton active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} icon={<Navigation size={24} />} label="Home" />
        <NavButton active={currentScreen === 'earnings'} onClick={() => setCurrentScreen('earnings')} icon={<TrendingUp size={24} />} label="Earnings" />
        <NavButton active={currentScreen === 'inbox'} onClick={() => setCurrentScreen('inbox')} icon={<Mail size={24} />} label="Inbox" />
        <NavButton active={currentScreen === 'account'} onClick={() => setCurrentScreen('account')} icon={<User size={24} />} label="Account" />
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-white' : 'text-gray-500'}`}>
      <div className={`p-1 rounded-full transition-colors ${active ? 'bg-white/10' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
