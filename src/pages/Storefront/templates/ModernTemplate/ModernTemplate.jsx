import React from 'react';
import './ModernTemplate.css';

export default function ModernTemplate({ children, primaryColor, secondaryColor }) {
  return (
    <div 
      className="storefront-wrapper sf-template-modern"
      style={{
        '--sf-primary': primaryColor || '#0F4C81',
        '--sf-secondary': secondaryColor || '#F0A500'
      }}
    >
      {children}
    </div>
  );
}
