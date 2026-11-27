import React from 'react';
import './ResortTemplate.css';

export default function ResortTemplate({ children, primaryColor, secondaryColor }) {
  return (
    <div 
      className="storefront-wrapper sf-template-resort"
      style={{
        '--sf-primary': primaryColor || '#2C533F',
        '--sf-secondary': secondaryColor || '#D4AF37'
      }}
    >
      {children}
    </div>
  );
}
