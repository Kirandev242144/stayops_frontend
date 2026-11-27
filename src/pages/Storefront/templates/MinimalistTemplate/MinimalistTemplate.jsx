import React from 'react';
import './MinimalistTemplate.css';

export default function MinimalistTemplate({ children, primaryColor, secondaryColor }) {
  return (
    <div 
      className="storefront-wrapper sf-template-minimalist"
      style={{
        '--sf-primary': primaryColor || '#111827',
        '--sf-secondary': secondaryColor || '#C5A059'
      }}
    >
      {children}
    </div>
  );
}
