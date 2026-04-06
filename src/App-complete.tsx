import React, { useState, useEffect } from 'react';

type Screen = 'home' | 'earnings' | 'account' | 'onboarding' | 'documents' | 'face_verification' | 'orders' | 'map' | 'settings' | 'notifications' | 'analytics';

interface User {
  name: string;
  rating: number;
  tier: 'Blue' | 'Gold' | 'Platinum' | 'Diamond';
  points: number;
  deliveries: number;
  isOnline: boolean;
  documentsUploaded: boolean;
  faceVerified: boolean;
  email: string;
}

interface Order {
  id: string;
  restaurantName: string;
  customerName: string;
  estimatedPay: number;
  estimatedDistance: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  restaurantLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number };
  orderType?: 'Standard' | 'Premium' | 'Urgent' | 'Bonus' | 'Smart Match';
}

interface OfflineNotification {
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

interface DocumentStatus {
  type: 'driving_licence' | 'vehicle_insurance' | 'vehicle_registration' | 'background_check';
  expiryDate: number;
  status: 'valid' | 'expiring_soon' | 'expired';
  renewalRequired: boolean;
  daysUntilExpiry: number;
  lastReminder?: number;
}

interface FinancialPressure {
  weeklyTarget: number;
  currentWeekProgress: number;
  debtAmount: number;
  missedWeeklyTargets: number;
  expenses: {
    fuel: number;
    insurance: number;
    maintenance: number;
    phone: number;
  };
}

interface RankDecay {
  points: number;
  currentRank: 'Blue' | 'Gold' | 'Platinum' | 'Diamond';
  warningLevel: 'none' | 'warning' | 'critical' | 'demotion_imminent';
  daysUntilDemotion: number;
  lastActivityDate: number;
  performanceScore: number;
  decayRate: number;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [user, setUser] = useState<User>({
    name: 'Driver',
    rating: 5.0,
    tier: 'Gold',
    points: 450,
    deliveries: 142,
    isOnline: false,
    documentsUploaded: false,
    faceVerified: false,
    email: 'driver@example.com'
  });
  const [earnings, setEarnings] = useState(124.50);
  const [bankBalance, setBankBalance] = useState(500.00);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [orderExpiryTimer, setOrderExpiryTimer] = useState(10);
  
  // Realistic job features state
  const [offlineNotifications, setOfflineNotifications] = useState<OfflineNotification[]>([]);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [consecutiveOfflineDays, setConsecutiveOfflineDays] = useState(0);
  const [currentSurge, setCurrentSurge] = useState(1.0);
  const [currentCity, setCurrentCity] = useState('London');
  
  // Document status tracking
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([
    { type: 'driving_licence', expiryDate: Date.now() + (90 * 24 * 60 * 60 * 1000), status: 'valid', renewalRequired: false, daysUntilExpiry: 90 },
    { type: 'vehicle_insurance', expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000), status: 'valid', renewalRequired: false, daysUntilExpiry: 30 },
    { type: 'vehicle_registration', expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), status: 'valid', renewalRequired: false, daysUntilExpiry: 365 },
    { type: 'background_check', expiryDate: Date.now() + (180 * 24 * 60 * 60 * 1000), status: 'valid', renewalRequired: false, daysUntilExpiry: 180 }
  ]);
  
  // Financial pressure
  const [financialPressure, setFinancialPressure] = useState<FinancialPressure>({
    weeklyTarget: 400,
    currentWeekProgress: 124.50,
    debtAmount: 0,
    missedWeeklyTargets: 0,
    expenses: {
      fuel: 50,
      insurance: 25,
      maintenance: 30,
      phone: 15
    }
  });
  
  // Rank decay system
  const [rankDecay, setRankDecay] = useState<RankDecay>({
    points: 450,
    currentRank: 'Gold',
    warningLevel: 'none',
    daysUntilDemotion: 30,
    lastActivityDate: Date.now(),
    performanceScore: 85,
    decayRate: 5
  });

  // Enhanced order generation with realistic features
  useEffect(() => {
    if (!user.isOnline || pendingOrder) return;
    
    const timer = setTimeout(() => {
      const orderTypes: Order['orderType'][] = ['Standard', 'Premium', 'Urgent', 'Bonus', 'Smart Match'];
      const restaurants = ['Greggs', 'McDonalds', 'KFC', 'Subway', 'Burger King', 'Nandos', 'Wagamama', 'Costa Coffee'];
      
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const basePay = orderType === 'Premium' ? 12 : orderType === 'Urgent' ? 10 : orderType === 'Bonus' ? 15 : 6;
      
      const newOrder: Order = {
        id: Math.random().toString(),
        restaurantName: restaurants[Math.floor(Math.random() * restaurants.length)],
        customerName: 'Customer',
        estimatedPay: Math.round((basePay + Math.random() * 8) * currentSurge * 100) / 100,
        estimatedDistance: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
        status: 'pending',
        restaurantLocation: { lat: 51.5074, lng: -0.1278 },
        customerLocation: { lat: 51.5074, lng: -0.1278 },
        orderType
      };
      
      setPendingOrder(newOrder);
      setOrderExpiryTimer(10);
    }, Math.random() * 10000 + 5000);
    
    return () => clearTimeout(timer);
  }, [user.isOnline, pendingOrder, currentSurge]);

  // Surge pricing system
  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21);
      const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
      
      let baseMultiplier = 1.0;
      
      if (isPeakHour) {
        baseMultiplier += 0.8;
      }
      
      if (isWeekend) {
        baseMultiplier += 0.4;
      }
      
      if (Math.random() < 0.15) {
        baseMultiplier += Math.random() * 0.5;
      }
      
      setCurrentSurge(Math.min(baseMultiplier, 2.5));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Rank decay system
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const daysSinceLastActivity = Math.floor((now - rankDecay.lastActivityDate) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastActivity > 0 && !user.isOnline) {
        const pointsLost = daysSinceLastActivity * rankDecay.decayRate;
        const newPoints = Math.max(0, rankDecay.points - pointsLost);
        
        let newRank: User['tier'] = 'Blue';
        if (newPoints >= 1000) newRank = 'Diamond';
        else if (newPoints >= 600) newRank = 'Platinum';
        else if (newPoints >= 300) newRank = 'Gold';
        
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
        
        if (newRank !== user.tier) {
          setUser(prev => ({ ...prev, tier: newRank, points: newPoints }));
          
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'rank_decay_warning',
            title: '🚨 Rank Decay Alert',
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
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user.isOnline, rankDecay.lastActivityDate, rankDecay.decayRate, user.tier]);

  // Document expiration system
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
      
      const hasExpiredDocs = updatedDocuments.some(doc => doc.status === 'expired');
      if (hasExpiredDocs && user.isOnline) {
        setUser(prev => ({ ...prev, isOnline: false }));
        
        const notification: OfflineNotification = {
          id: Math.random().toString(),
          type: 'document_expiry',
          title: '🚨 Document Expired',
          message: 'Your documents have expired. You cannot work until they are renewed.',
          priority: 'urgent',
          timestamp: now,
          isRead: false,
          actionable: true,
          actionUrl: 'account'
        };
        setOfflineNotifications(prev => [notification, ...prev]);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Offline notifications for surges and missed opportunities
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user.isOnline) {
        const now = Date.now();
        
        if (currentSurge > 1.5 && Math.random() < 0.3) {
          const notification: OfflineNotification = {
            id: Math.random().toString(),
            type: 'surge_alert',
            title: '🔥 Surge Pricing Active!',
            message: `${currentSurge.toFixed(1)}x surge in ${currentCity}. You're missing out on higher earnings!`,
            priority: 'high',
            timestamp: now,
            isRead: false,
            actionable: true,
            actionUrl: 'home'
          };
          setOfflineNotifications(prev => [notification, ...prev]);
        }
        
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
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user.isOnline, currentSurge, currentCity]);

  // Financial pressure system
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dayOfWeek = new Date(now).getDay();
      const isStartOfWeek = dayOfWeek === 1;
      
      if (isStartOfWeek) {
        if (financialPressure.currentWeekProgress < financialPressure.weeklyTarget) {
          const shortfall = financialPressure.weeklyTarget - financialPressure.currentWeekProgress;
          const newDebt = financialPressure.debtAmount + shortfall;
          
          setFinancialPressure(prev => ({
            ...prev,
            debtAmount: newDebt,
            missedWeeklyTargets: prev.missedWeeklyTargets + 1,
            currentWeekProgress: 0
          }));
          
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
          setFinancialPressure(prev => ({
            ...prev,
            currentWeekProgress: 0
          }));
        }
      }
    }, 60000);
    
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

  // Order expiry timer
  useEffect(() => {
    if (!pendingOrder) return;
    
    const timer = setInterval(() => {
      setOrderExpiryTimer(prev => {
        if (prev <= 1) {
          setPendingOrder(null);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [pendingOrder]);

  const acceptOrder = () => {
    if (pendingOrder) {
      setActiveOrders([...activeOrders, { ...pendingOrder, status: 'accepted' }]);
      const pay = pendingOrder.estimatedPay;
      setEarnings(prev => prev + pay);
      setFinancialPressure(prev => ({ ...prev, currentWeekProgress: prev.currentWeekProgress + pay }));
      setPendingOrder(null);
    }
  };

  const rejectOrder = () => {
    setPendingOrder(null);
  };

  const toggleOnline = () => {
    if (!user.documentsUploaded || !user.faceVerified) {
      alert('Please complete documents and face verification first!');
      return;
    }
    
    const hasExpiredDocs = documentStatuses.some(doc => doc.status === 'expired');
    if (hasExpiredDocs) {
      alert('Cannot go online with expired documents. Please renew them first.');
      return;
    }
    
    setUser(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  const uploadDoc = (docName: string) => {
    setUploadedDocs([...uploadedDocs, docName]);
    if (uploadedDocs.length + 1 >= 3) {
      setTimeout(() => setUser(prev => ({ ...prev, documentsUploaded: true })), 1000);
    }
  };

  const verifyFace = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setUser(prev => ({ ...prev, faceVerified: true }));
      setCurrentScreen('home');
    }, 3000);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '400px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#000'
            }}>
              U
            </div>
            <h1 style={{ fontSize: '32px', marginBottom: '10px', fontWeight: 'bold' }}>
              Drive when you want,<br/>earn what you need
            </h1>
            <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '30px' }}>
              By continuing, you agree to our Terms of Service
            </p>
            <button 
              style={{
                padding: '18px',
                fontSize: '20px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%',
                letterSpacing: '1px'
              }}
              onClick={() => setCurrentScreen('documents')}
            >
              CONTINUE
            </button>
          </div>
        );
        
      case 'home':
        return (
          <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '10px 0'
            }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Uber Eats</h1>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setCurrentScreen('notifications')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', position: 'relative' }}>
                  🔔
                  {offlineNotifications.filter(n => !n.isRead).length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {offlineNotifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                <button onClick={() => setCurrentScreen('earnings')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>💰</button>
                <button onClick={() => setCurrentScreen('account')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>👤</button>
              </div>
            </div>
            
            {/* Offline Notifications Display */}
            {offlineNotifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  backgroundColor: notification.priority === 'urgent' ? '#f4433620' :
                                   notification.priority === 'high' ? '#ff980020' :
                                   notification.priority === 'medium' ? '#ffeb3b20' : '#2196f320',
                  border: `1px solid ${notification.priority === 'urgent' ? '#f44336' :
                                      notification.priority === 'high' ? '#ff9800' :
                                      notification.priority === 'medium' ? '#ffeb3b' : '#2196f3'}`,
                  color: notification.priority === 'urgent' ? '#f44336' :
                         notification.priority === 'high' ? '#ff9800' :
                         notification.priority === 'medium' ? '#ffeb3b' : '#2196f3'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 4px 0' }}>{notification.title}</p>
                    <p style={{ fontSize: '11px', margin: 0, opacity: 0.8 }}>{notification.message}</p>
                  </div>
                  {notification.actionable && (
                    <button
                      onClick={() => {
                        if (notification.actionUrl) {
                          setCurrentScreen(notification.actionUrl as Screen);
                        }
                        setOfflineNotifications(prev => prev.filter(n => n.id !== notification.id));
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#fff',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Action
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Status Cards */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                flex: 1,
                backgroundColor: user.isOnline ? '#4CAF50' : '#333',
                padding: '15px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {user.isOnline ? '🟢 Online' : '🔴 Offline'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {consecutiveOfflineDays > 0 && `Offline ${consecutiveOfflineDays} days`}
                </div>
              </div>
              
              <div style={{
                flex: 1,
                backgroundColor: currentSurge > 1.2 ? '#ff9800' : '#333',
                padding: '15px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  🔥 {currentSurge > 1.2 ? `${currentSurge.toFixed(1)}x Surge` : 'Normal'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {currentCity}
                </div>
              </div>
            </div>
            
            {/* Rank Status */}
            <div style={{
              backgroundColor: rankDecay.warningLevel === 'critical' ? '#f4433620' :
                           rankDecay.warningLevel === 'warning' ? '#ff980020' : '#333',
              padding: '15px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '20px',
              border: rankDecay.warningLevel !== 'none' ? `1px solid ${
                rankDecay.warningLevel === 'critical' ? '#f44336' :
                rankDecay.warningLevel === 'warning' ? '#ff9800' : '#333'
              }` : 'none'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                🏆 {user.tier} Tier • {user.points} pts
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {rankDecay.warningLevel !== 'none' && 
                 `⚠️ ${rankDecay.daysUntilDemotion} days to demotion`
                }
              </div>
            </div>
            
            {/* Financial Pressure */}
            <div style={{
              backgroundColor: financialPressure.debtAmount > 0 ? '#f4433620' : '#333',
              padding: '15px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '20px',
              border: financialPressure.debtAmount > 0 ? '1px solid #f44336' : 'none'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                💳 Weekly Target: £{financialPressure.weeklyTarget}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Progress: £{financialPressure.currentWeekProgress.toFixed(2)}
                {financialPressure.debtAmount > 0 && ` • Debt: £${financialPressure.debtAmount.toFixed(2)}`}
              </div>
            </div>
            
            {/* Online Status Toggle */}
            <button 
              onClick={toggleOnline}
              style={{
                padding: '15px',
                fontSize: '18px',
                backgroundColor: user.isOnline ? '#f44336' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%',
                marginBottom: '20px'
              }}
            >
              {user.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
            
            {/* Map Area */}
            <div style={{
              flex: 1,
              backgroundColor: '#111',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
                <p>Map View • {activeOrders.length} active orders</p>
              </div>
            </div>
            
            {/* Order Request */}
            {pendingOrder && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                backgroundColor: '#fff',
                color: '#000',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                    {pendingOrder.orderType === 'Premium' ? '🌟 Premium' :
                     pendingOrder.orderType === 'Urgent' ? '🚨 Urgent' :
                     pendingOrder.orderType === 'Bonus' ? '💰 Bonus' :
                     pendingOrder.orderType === 'Smart Match' ? '🎯 Smart Match' :
                     'New Order'}!
                  </span>
                  <span style={{ color: '#f44336', fontWeight: 'bold' }}>{orderExpiryTimer}s</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>{pendingOrder.restaurantName}</div>
                  <div style={{ color: '#666' }}>→ {pendingOrder.customerName}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                    £{pendingOrder.estimatedPay.toFixed(2)} • {pendingOrder.estimatedDistance} mi
                    {currentSurge > 1.2 && ` • ${currentSurge.toFixed(1)}x surge`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={acceptOrder}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={rejectOrder}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'notifications':
        return (
          <div style={{ padding: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentScreen('home')}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Notifications</h1>
            </div>
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px' }}>
              {offlineNotifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No notifications</p>
              ) : (
                offlineNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      borderRadius: '8px',
                      backgroundColor: notification.isRead ? '#222' : '#333',
                      borderLeft: `4px solid ${
                        notification.priority === 'urgent' ? '#f44336' :
                        notification.priority === 'high' ? '#ff9800' :
                        notification.priority === 'medium' ? '#ffeb3b' : '#2196f3'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px 0' }}>{notification.title}</p>
                        <p style={{ fontSize: '12px', color: '#ccc', margin: '0 0 8px 0' }}>{notification.message}</p>
                        <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => setOfflineNotifications(prev => 
                            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                          )}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#2196f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
        
      case 'earnings':
        return (
          <div style={{ padding: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentScreen('home')}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Earnings</h1>
            </div>
            
            <div style={{
              backgroundColor: '#4CAF50',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                £{earnings.toFixed(2)}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>Today's Earnings</div>
            </div>
            
            <div style={{
              backgroundColor: '#2196F3',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                £{bankBalance.toFixed(2)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Bank Balance</div>
            </div>
            
            {/* Financial Pressure Display */}
            <div style={{
              backgroundColor: financialPressure.debtAmount > 0 ? '#f4433620' : '#111',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: financialPressure.debtAmount > 0 ? '1px solid #f44336' : 'none'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px', color: financialPressure.debtAmount > 0 ? '#f44336' : '#fff' }}>
                💳 Financial Pressure
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Weekly Target</span>
                <span>£{financialPressure.weeklyTarget}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Progress</span>
                <span style={{ color: financialPressure.currentWeekProgress >= financialPressure.weeklyTarget ? '#4CAF50' : '#fff' }}>
                  £{financialPressure.currentWeekProgress.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Debt</span>
                <span style={{ color: financialPressure.debtAmount > 0 ? '#f44336' : '#4CAF50' }}>
                  £{financialPressure.debtAmount.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Missed Weeks</span>
                <span>{financialPressure.missedWeeklyTargets}</span>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Recent Trips</h3>
              {[
                { restaurant: 'Greggs', pay: '£4.50', time: '2:14 PM', type: 'Standard' },
                { restaurant: 'McDonalds', pay: '£8.20', time: '1:45 PM', type: 'Premium' },
                { restaurant: 'KFC', pay: '£6.75', time: '12:30 PM', type: 'Urgent' },
              ].map((trip, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #333'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{trip.restaurant}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{trip.time} • {trip.type}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>{trip.pay}</div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'account':
        return (
          <div style={{ padding: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentScreen('home')}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Account</h1>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#333',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                fontSize: '32px'
              }}>
                👤
              </div>
              <h2 style={{ fontSize: '20px', marginBottom: '5px' }}>{user.name}</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>{user.email}</p>
            </div>
            
            {/* Rank Status */}
            <div style={{
              backgroundColor: rankDecay.warningLevel === 'critical' ? '#f4433620' :
                           rankDecay.warningLevel === 'warning' ? '#ff980020' : '#111',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: rankDecay.warningLevel !== 'none' ? `1px solid ${
                rankDecay.warningLevel === 'critical' ? '#f44336' :
                rankDecay.warningLevel === 'warning' ? '#ff9800' : '#333'
              }` : 'none'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>🏆 Rank Status</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Current Tier</span>
                <span style={{ 
                  color: user.tier === 'Diamond' ? '#B9F2FF' : 
                         user.tier === 'Platinum' ? '#E5E4E2' : 
                         user.tier === 'Gold' ? '#FFD700' : '#C0C0C0' 
                }}>
                  {user.tier}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Points</span>
                <span>{user.points}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Performance</span>
                <span>{rankDecay.performanceScore}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status</span>
                <span style={{ color: rankDecay.warningLevel === 'critical' ? '#f44336' :
                                 rankDecay.warningLevel === 'warning' ? '#ff9800' : '#4CAF50' }}>
                  {rankDecay.warningLevel === 'critical' ? 'Critical' :
                   rankDecay.warningLevel === 'warning' ? 'Warning' :
                   rankDecay.warningLevel === 'demotion_imminent' ? 'Demotion Imminent' : 'Good'}
                </span>
              </div>
            </div>
            
            {/* Document Status */}
            <div style={{
              backgroundColor: '#111',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>📄 Documents</h3>
              {documentStatuses.map((doc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>{doc.type.replace('_', ' ')}</span>
                  <span style={{ 
                    color: doc.status === 'expired' ? '#f44336' :
                           doc.status === 'expiring_soon' ? '#ff9800' : '#4CAF50'
                  }}>
                    {doc.status === 'expired' ? 'Expired' :
                     doc.status === 'expiring_soon' ? `${doc.daysUntilExpiry} days` : 'Valid'}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span>Rating</span>
                <span style={{ color: '#FFD700' }}>⭐ {user.rating}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span>Deliveries</span>
                <span>{user.deliveries}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status</span>
                <span style={{ color: user.isOnline ? '#4CAF50' : '#f44336' }}>
                  {user.isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setCurrentScreen('documents')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📄 Documents
              </button>
              <button 
                onClick={() => setCurrentScreen('settings')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        );
        
      case 'documents':
        return (
          <div style={{ padding: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentScreen('onboarding')}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Documents</h1>
            </div>
            
            <p style={{ color: '#ccc', marginBottom: '24px' }}>Tap each item to upload your documents.</p>
            
            {[
              { label: "Driving Licence", icon: "📄" },
              { label: "Vehicle Insurance", icon: "🛡️" },
              { label: "Bank Statement", icon: "💳" },
            ].map((doc, i) => {
              const isUploaded = uploadedDocs.includes(doc.label);
              return (
                <button 
                  key={i}
                  onClick={() => !isUploaded && uploadDoc(doc.label)}
                  disabled={isUploaded}
                  style={{
                    width: '100%',
                    padding: '20px',
                    border: isUploaded ? '2px solid #4CAF50' : '2px solid #333',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isUploaded ? '#4CAF5020' : '#111',
                    cursor: isUploaded ? 'default' : 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{doc.icon}</span>
                    <span style={{ fontWeight: 'bold', color: isUploaded ? '#4CAF50' : '#fff' }}>
                      {doc.label}
                    </span>
                  </div>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isUploaded ? '#4CAF50' : '#333',
                    color: isUploaded ? '#fff' : '#666'
                  }}>
                    {isUploaded ? '✓' : '→'}
                  </div>
                </button>
              );
            })}
            
            {user.documentsUploaded && (
              <button 
                onClick={() => setCurrentScreen('face_verification')}
                style={{
                  width: '100%',
                  padding: '18px',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  marginTop: '20px'
                }}
              >
                Continue to Face Verification
              </button>
            )}
          </div>
        );
        
      case 'face_verification':
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            backgroundColor: '#000'
          }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
              <button 
                onClick={() => setCurrentScreen('documents')}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              >
                ←
              </button>
            </div>
            
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>Face Verification</h1>
            <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '40px' }}>
              Position your face in the circle to verify your identity.
            </p>
            
            <div style={{
              width: '288px',
              height: '288px',
              borderRadius: '50%',
              border: '4px solid #2196F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#111'
            }}>
              {isVerifying && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#2196F3',
                  animation: 'scan 3s linear infinite'
                }} />
              )}
              <div style={{
                fontSize: '48px',
                color: '#666',
                textAlign: 'center'
              }}>
                {isVerifying ? '📷 Scanning...' : '👤'}
              </div>
            </div>
            
            <button 
              onClick={verifyFace}
              disabled={isVerifying}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: isVerifying ? '#333' : '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isVerifying ? 'default' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Face'}
            </button>
          </div>
        );
        
      case 'settings':
        return (
          <div style={{ padding: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentScreen('account')}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Settings</h1>
            </div>
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Preferences</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Push Notifications</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </label>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Sound Effects</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </label>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Dark Mode</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </label>
              </div>
              
              <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
                <button style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', 
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {renderScreen()}
      
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

export default App;
