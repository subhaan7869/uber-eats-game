import React, { useState } from 'react';

type Screen = 'home' | 'earnings' | 'account' | 'onboarding';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>UBER EATS DRIVER</h1>
            <p style={{ fontSize: '18px', marginBottom: '30px', color: '#ccc' }}>
              Drive when you want, earn what you need
            </p>
            <button 
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '200px'
              }}
              onClick={() => setCurrentScreen('home')}
            >
              CONTINUE
            </button>
          </div>
        );
        
      case 'home':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>HOME</h1>
            <p style={{ fontSize: '18px', marginBottom: '30px', color: '#ccc' }}>
              Welcome to your dashboard
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onClick={() => setCurrentScreen('earnings')}
              >
                💰 Earnings
              </button>
              <button 
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onClick={() => setCurrentScreen('account')}
              >
                👤 Account
              </button>
            </div>
          </div>
        );
        
      case 'earnings':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>EARNINGS</h1>
            <p style={{ fontSize: '24px', marginBottom: '20px', color: '#4CAF50' }}>
              💰 £124.50
            </p>
            <p style={{ fontSize: '16px', color: '#ccc', marginBottom: '30px' }}>
              Today's earnings
            </p>
            <button 
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => setCurrentScreen('home')}
            >
              ← Back to Home
            </button>
          </div>
        );
        
      case 'account':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>ACCOUNT</h1>
            <p style={{ fontSize: '18px', marginBottom: '10px', color: '#ccc' }}>
              Driver Profile
            </p>
            <p style={{ fontSize: '20px', marginBottom: '30px' }}>
              ⭐ 5.0 Rating<br/>
              🚗 142 Deliveries<br/>
              🏆 Gold Tier
            </p>
            <button 
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => setCurrentScreen('home')}
            >
              ← Back to Home
            </button>
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
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      {renderScreen()}
    </div>
  );
}

export default App;
