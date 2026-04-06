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
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Location, Order, AppScreen, ChatMessage, UserProfile, UberProTier } from './types';

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
    if (!CLOUD_PROFILE_URL) return null;
    try {
      const res = await fetch(CLOUD_PROFILE_URL, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data as Partial<UserProfile>;
    } catch {
      return null;
    }
  };

  const saveUserProfileToCloud = async (profile: UserProfile) => {
    if (!CLOUD_PROFILE_URL) return;
    try {
      await fetch(CLOUD_PROFILE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile),
      });
    } catch {
      // Ignore cloud errors; local save still works
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
  const [verifyTimeoutUntil, setVerifyTimeoutUntil] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<{ latitude: number, longitude: number, intensity: number, size: number }[]>([]);

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

  const sendNotification = (title: string, body: string) => {
    // In-app only: store message for Inbox/alerts, no OS notifications
    setNotifications(prev => [`${title}: ${body}`, ...prev]);
  };

  const generateEmailVerificationCode = () => {
    // 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendEmailVerificationCode = async (email: string) => {
    if (!email) return;

    const senderEmail = 'uberclone@game.com';
    const now = Date.now();
    if (emailSendCooldownUntil && now < emailSendCooldownUntil) return;

    setIsSendingEmailCode(true);
    const code = generateEmailVerificationCode();
    const expiresAt = now + 10 * 60_000; // 10 minutes

    // Local fallback: keep code in memory (demo-style)
    setPendingEmailCode(code);
    setPendingEmailCodeExpiresAt(expiresAt);
    setEmailCodeInput('');
    setEmailSendCooldownUntil(now + 30_000); // 30s resend cooldown

    try {
      if (CLOUD_SEND_EMAIL_CODE_URL) {
        // Demo integration: your backend can send a real email to the user
        await fetch(CLOUD_SEND_EMAIL_CODE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, deviceId }),
        });
      }
    } catch {
      // Ignore; we'll still show the code in UI/notification for this simulation
    } finally {
      setIsSendingEmailCode(false);
      sendNotification(
        "Email Verification Code Sent",
        `From ${senderEmail}. Demo code: ${code}`
      );
    }
  };

  // When we land on the email verification screen, ensure we have an active code
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
    await new Promise(r => setTimeout(r, 1500)); // Simulate upload time
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
    const pay = 3.0 + (tripDist * 1.2) + (Math.random() * 1.5);

    return {
      id: Math.random().toString(36).substr(2, 9),
      restaurantName: randomRest.name,
      customerName,
      restaurantLocation: { latitude: restLat, longitude: restLng },
      customerLocation: { latitude: custLat, longitude: custLng },
      estimatedPay: pay,
      estimatedDistance: tripDist,
      estimatedTime: Math.floor(tripDist * 5 + 4),
      status: 'pending' as const,
      items: ["Meal Deal", "Soft Drink"],
      distToRest,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      matchingType: 'normal' as const,
    };
  };

  // Improved Order Matching Algorithm (smart)
  const generateSmartOrder = () => {
    if (!location) return null;

    // 1. Generate 5 candidate orders
    const candidates = Array.from({ length: 5 }).map(() => {
      const randomRest = MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)];
      const customerName = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];
      
      const restLat = location.latitude + randomRest.offset.lat;
      const restLng = location.longitude + randomRest.offset.lng;
      const custLat = restLat + (Math.random() - 0.5) * 0.01;
      const custLng = restLng + (Math.random() - 0.5) * 0.01;

      const distToRest = Math.sqrt(Math.pow(restLat - location.latitude, 2) + Math.pow(restLng - location.longitude, 2)) * MILES_PER_DEGREE;
      const tripDist = Math.sqrt(Math.pow(custLat - restLat, 2) + Math.pow(custLng - restLng, 2)) * MILES_PER_DEGREE;
      const pay = 3.50 + (tripDist * 1.5) + (Math.random() * 2);

      return {
        id: Math.random().toString(36).substr(2, 9),
        restaurantName: randomRest.name,
        customerName,
        restaurantLocation: { latitude: restLat, longitude: restLng },
        customerLocation: { latitude: custLat, longitude: custLng },
        estimatedPay: pay,
        estimatedDistance: tripDist,
        estimatedTime: Math.floor(tripDist * 5 + 5),
        status: 'pending' as const,
        items: ["Meal Deal", "Extra Fries", "Coke Zero"],
        distToRest,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        matchingType: 'smart' as const,
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
          sendNotification("High Priority Trip", `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName}`);
          playUberSound('order');
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

  const handleConfirmEmailCode = () => {
    if (!pendingEmailCode || !pendingEmailCodeExpiresAt) return;
    const now = Date.now();
    if (now > pendingEmailCodeExpiresAt) {
      sendNotification("Code Expired", "Request a new verification code.");
      return;
    }

    if (emailCodeInput.trim() !== pendingEmailCode) {
      sendNotification("Incorrect Code", "That email verification code is not correct.");
      return;
    }

    // Mark this device as verified for the account
    setUser(u => ({
      ...u,
      email: emailAddressInput || u.email,
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
  };

  const [isFlashing, setIsFlashing] = useState(false);

  // When going online, keep the bottom menu closed by default
  useEffect(() => {
    if (user.isOnline) {
      setIsBottomMenuOpen(false);
    }
  }, [user.isOnline]);

  const playUberSound = (type: 'order' | 'accept' | 'message' | 'complete') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'order') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } else if (type === 'accept') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'message') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'complete') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio not supported or blocked", e);
    }
  };

  const handleVerify = async () => {
    if (isVerifying) return;
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

    await new Promise(r => setTimeout(r, 2000));
    
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
      
      await new Promise(r => setTimeout(r, 1500));
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
          { icon: <Mail />, label: "Inbox", screen: 'inbox' },
          { icon: <ShieldCheck />, label: "Safety Toolkit", screen: 'safety' },
          { icon: <Settings />, label: "Account", screen: 'account' },
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
    <div className={`h-screen w-full font-sans overflow-hidden flex flex-col select-none relative transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-100 text-black'}`}>
      {/* Status Bar */}
      <div className={`h-6 w-full flex justify-between items-center px-6 text-[10px] font-medium opacity-80 z-[110] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <Zap size={10} fill="currentColor" />
          <span>5G</span>
          <div className={`w-4 h-2 border rounded-[2px] relative ${theme === 'dark' ? 'border-white/40' : 'border-black/40'}`}>
            <div className={`absolute left-0 top-0 h-full w-3/4 rounded-[1px] ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSideMenuOpen && <SideMenu />}
      </AnimatePresence>

      <div className="flex-1 relative overflow-hidden">
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
                onClick={handleVerify}
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
                  onClick={handleConfirmEmailCode}
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
                    </div>

                    <div className="flex-1 p-8 flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h2 className="text-4xl font-black mb-1">£{pendingOrder.estimatedPay.toFixed(2)}</h2>
                          <p className="text-orange-400 font-black tracking-widest uppercase text-xs">Estimated Pay</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">{pendingOrder.estimatedTime} min</p>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{pendingOrder.estimatedDistance.toFixed(1)} mi • Total</p>
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

              {/* Map Simulation */}
              <div 
                onClick={() => setSelectedMarkerId(null)}
                className={`absolute inset-0 overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0d0f12]' : 'bg-[#f3f4f2]'} ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'blur-md grayscale opacity-50 pointer-events-none' : ''}`}
              >
                {/* Zoom controls */}
                <div className="absolute top-24 right-4 z-40 flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapZoom(z => Math.min(1.8, z + 0.2));
                    }}
                    className="w-8 h-8 rounded-full bg-black/70 text-white text-lg font-black flex items-center justify-center border border-white/20 active:scale-95"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapZoom(z => Math.max(0.6, z - 0.2));
                    }}
                    className="w-8 h-8 rounded-full bg-black/70 text-white text-lg font-black flex items-center justify-center border border-white/20 active:scale-95"
                  >
                    –
                  </button>
                </div>
                {/* City texture (subtle block shading) */}
                <div className="absolute inset-0 opacity-50" style={{ 
                  backgroundImage: `
                    linear-gradient(45deg, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 25%, transparent 25%, transparent 75%, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 75%, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}),
                    linear-gradient(45deg, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 25%, transparent 25%, transparent 75%, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 75%, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'})
                  `,
                  backgroundSize: `${120 * mapZoom}px ${120 * mapZoom}px, ${120 * mapZoom}px ${120 * mapZoom}px`,
                  backgroundPosition: '0 0, 60px 60px',
                  transform: location ? `translate(${(location.longitude * 4500) % 120}px, ${(location.latitude * 4500) % 120}px)` : 'none'
                }} />
                
                {/* Major roads */}
                <div className="absolute inset-0 opacity-95 pointer-events-none" style={{ 
                  backgroundImage: `
                    linear-gradient(90deg, transparent 45%, ${theme === 'dark' ? 'rgba(240,244,247,0.22)' : 'rgba(71,85,105,0.2)'} 45%, ${theme === 'dark' ? 'rgba(240,244,247,0.22)' : 'rgba(71,85,105,0.2)'} 55%, transparent 55%),
                    linear-gradient(transparent 45%, ${theme === 'dark' ? 'rgba(240,244,247,0.22)' : 'rgba(71,85,105,0.2)'} 45%, ${theme === 'dark' ? 'rgba(240,244,247,0.22)' : 'rgba(71,85,105,0.2)'} 55%, transparent 55%)
                  `,
                  backgroundSize: `${260 * mapZoom}px ${260 * mapZoom}px`,
                  transform: location ? `translate(${(location.longitude * 7200) % 260}px, ${(location.latitude * 7200) % 260}px)` : 'none'
                }} />
                
                {/* Minor roads */}
                <div className="absolute inset-0 opacity-90 pointer-events-none" style={{ 
                  backgroundImage: `
                    linear-gradient(90deg, transparent 49%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(100,116,139,0.12)'} 49%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(100,116,139,0.12)'} 51%, transparent 51%),
                    linear-gradient(transparent 49%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(100,116,139,0.12)'} 49%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(100,116,139,0.12)'} 51%, transparent 51%)
                  `,
                  backgroundSize: `${64 * mapZoom}px ${64 * mapZoom}px`,
                  transform: location ? `translate(${(location.longitude * 5800) % 64}px, ${(location.latitude * 5800) % 64}px)` : 'none'
                }} />
                
                {/* Water and parks */}
                <div className="absolute inset-0 opacity-35 pointer-events-none" style={{ 
                  backgroundImage: `
                    radial-gradient(circle at 20% 25%, ${theme === 'dark' ? 'rgba(80,122,160,0.16)' : 'rgba(96,165,250,0.14)'} 0%, transparent 36%),
                    radial-gradient(circle at 80% 75%, ${theme === 'dark' ? 'rgba(58,113,80,0.2)' : 'rgba(74,222,128,0.14)'} 0%, transparent 34%)
                  `,
                  backgroundSize: `${520 * mapZoom}px ${520 * mapZoom}px, ${460 * mapZoom}px ${460 * mapZoom}px`,
                  transform: location ? `translate(${(location.longitude * 2200) % 520}px, ${(location.latitude * 2200) % 520}px)` : 'none'
                }} />

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
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      className={`w-full ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} rounded-full shadow-2xl border border-white/10 flex items-center justify-between px-6 py-4`}
                    >
                      <button
                        type="button"
                        onClick={() => setIsBottomMenuOpen(true)}
                        className="flex items-center gap-3 ml-2 active:scale-95 transition-transform"
                      >
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2 h-2 bg-blue-500 rounded-full" 
                        />
                        <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {(() => {
                            const hour = new Date().getHours();
                            if (hour >= 11 && hour <= 14) {
                              const lunchPhrases = [
                                "Lunchtime rush — lots of orders",
                                "Busy lunch hour",
                                "Midday demand picking up"
                              ];
                              return lunchPhrases[Math.floor(Math.random() * lunchPhrases.length)];
                            }
                            if (hour >= 17 && hour <= 20) {
                              const dinnerPhrases = [
                                "Dinnertime — prime hours",
                                "Evening rush in your area",
                                "Busy dinner deliveries"
                              ];
                              return dinnerPhrases[Math.floor(Math.random() * dinnerPhrases.length)];
                            }
                            const idlePhrases = [
                              "Finding trips",
                              "Standing by for requests",
                              "Waiting for the next order",
                              "Checking nearby hotspots"
                            ];
                            return idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
                          })()}
                        </span>
                      </button>

                      <button 
                        onClick={() => {
                          setUser(u => ({ ...u, isOnline: false, faceVerified: false }));
                          setIsBottomMenuOpen(false);
                        }} 
                        className="bg-red-600 text-white px-6 py-2 rounded-full font-black text-sm active:scale-95 transition-transform"
                      >
                        OFFLINE
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex justify-center">
                      <motion.button
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsBottomMenuOpen(true)}
                        className="bg-black text-white px-8 py-4 rounded-full font-black text-lg shadow-2xl flex items-center gap-3 border border-white/10"
                      >
                        <ChevronUp size={24} className="animate-bounce" />
                        <span>OPEN MENU</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {isBottomMenuOpen && (
                  <div className="absolute inset-0 z-[150]">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsBottomMenuOpen(false)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] flex flex-col max-h-[70vh] overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                    >
                      <div className="flex flex-col items-center pt-4 pb-2">
                        <div className={`w-12 h-1.5 rounded-full mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                      </div>
                      
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
