import React, { useState, useEffect } from 'react';

type Screen = 'home' | 'earnings' | 'account' | 'onboarding' | 'documents' | 'face_verification' | 'orders' | 'map' | 'settings';

interface User {
  name: string;
  rating: number;
  tier: 'Blue' | 'Gold' | 'Platinum' | 'Diamond';
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
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [user, setUser] = useState<User>({
    name: 'Driver',
    rating: 5.0,
    tier: 'Gold',
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

  // Simulate incoming orders
  useEffect(() => {
    if (!user.isOnline || pendingOrder) return;
    
    const timer = setTimeout(() => {
      const newOrder: Order = {
        id: Math.random().toString(),
        restaurantName: ['Greggs', 'McDonalds', 'KFC', 'Subway', 'Burger King'][Math.floor(Math.random() * 5)],
        customerName: 'Customer',
        estimatedPay: Math.round((Math.random() * 10 + 5) * 100) / 100,
        estimatedDistance: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
        status: 'pending',
        restaurantLocation: { lat: 51.5074, lng: -0.1278 },
        customerLocation: { lat: 51.5074, lng: -0.1278 }
      };
      
      setPendingOrder(newOrder);
      setOrderExpiryTimer(10);
    }, Math.random() * 10000 + 5000);
    
    return () => clearTimeout(timer);
  }, [user.isOnline, pendingOrder]);

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
      setPendingOrder(null);
      setEarnings(prev => prev + pendingOrder.estimatedPay);
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
                <button onClick={() => setCurrentScreen('earnings')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>💰</button>
                <button onClick={() => setCurrentScreen('account')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>👤</button>
              </div>
            </div>
            
            {/* Online Status */}
            <div style={{
              backgroundColor: user.isOnline ? '#4CAF50' : '#333',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                {user.isOnline ? '🟢 Online' : '🔴 Offline'}
              </div>
              <button 
                onClick={toggleOnline}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {user.isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
            
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
                <p>Map View</p>
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
                  <span style={{ fontWeight: 'bold', fontSize: '18px' }}>New Order!</span>
                  <span style={{ color: '#f44336', fontWeight: 'bold' }}>{orderExpiryTimer}s</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>{pendingOrder.restaurantName}</div>
                  <div style={{ color: '#666' }}>→ {pendingOrder.customerName}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                    £{pendingOrder.estimatedPay.toFixed(2)} • {pendingOrder.estimatedDistance} mi
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
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Recent Trips</h3>
              {[
                { restaurant: 'Greggs', pay: '£4.50', time: '2:14 PM' },
                { restaurant: 'McDonalds', pay: '£6.80', time: '1:45 PM' },
                { restaurant: 'KFC', pay: '£5.20', time: '12:30 PM' },
              ].map((trip, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #333'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{trip.restaurant}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{trip.time}</div>
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
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span>Rating</span>
                <span style={{ color: '#FFD700' }}>⭐ {user.rating}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span>Deliveries</span>
                <span>{user.deliveries}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span>Tier</span>
                <span style={{ 
                  color: user.tier === 'Diamond' ? '#B9F2FF' : 
                         user.tier === 'Platinum' ? '#E5E4E2' : 
                         user.tier === 'Gold' ? '#FFD700' : '#C0C0C0' 
                }}>
                  🏆 {user.tier}
                </span>
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
