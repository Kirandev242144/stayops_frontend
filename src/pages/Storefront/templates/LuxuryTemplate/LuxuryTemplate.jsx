import React from 'react';
import './LuxuryTemplate.css';

export default function LuxuryTemplate({ children, primaryColor, secondaryColor }) {
  return (
    <div 
      className="storefront-wrapper sf-template-luxury"
      style={{
        '--sf-primary': primaryColor || '#6B1D2F',
        '--sf-secondary': secondaryColor || '#C5A059'
      }}
    >
      {children}
    </div>
  );
}
