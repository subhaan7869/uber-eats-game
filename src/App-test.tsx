import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'black', fontSize: '24px' }}>Uber Eats Driver Test</h1>
      <p style={{ color: '#666', fontSize: '16px' }}>If you can see this, React is working!</p>
      <button 
        onClick={() => alert('Button works!')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#000', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default App;
