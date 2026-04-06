import React from 'react';

function App() {
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
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>UBER EATS</h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>Driver Simulation</p>
      <button 
        style={{
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#fff',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
        onClick={() => alert('Button works!')}
      >
        START DRIVING
      </button>
    </div>
  );
}

export default App;
