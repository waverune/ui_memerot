import React from 'react';

const FloatingElements: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Generate floating elements with different colors, sizes, and animations */}
      <div className="floating-element bg-blue-400/30 blur-xl" style={{
        width: '150px',
        height: '150px',
        left: '10%',
        top: '20%',
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div className="floating-element bg-purple-400/30 blur-xl" style={{
        width: '180px',
        height: '180px',
        right: '15%',
        top: '15%',
        animation: 'float 25s ease-in-out infinite 2s'
      }} />
      <div className="floating-element bg-pink-400/30 blur-xl" style={{
        width: '120px',
        height: '120px',
        left: '20%',
        bottom: '20%',
        animation: 'float 22s ease-in-out infinite 1s'
      }} />
      <div className="floating-element bg-green-400/30 blur-xl" style={{
        width: '160px',
        height: '160px',
        right: '25%',
        bottom: '25%',
        animation: 'float 28s ease-in-out infinite 3s'
      }} />
      <div className="floating-element bg-yellow-400/30 blur-xl" style={{
        width: '140px',
        height: '140px',
        left: '40%',
        top: '40%',
        animation: 'float 24s ease-in-out infinite 4s'
      }} />
      <div className="floating-element bg-cyan-400/30 blur-xl" style={{
        width: '130px',
        height: '130px',
        right: '35%',
        top: '30%',
        animation: 'float 26s ease-in-out infinite 2.5s'
      }} />
    </div>
  );
};

export default FloatingElements; 