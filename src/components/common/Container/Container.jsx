import React from 'react';
import './Container.css';

/**
 * Container Component
 * Wraps content within a max-width and centers it on the screen.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements passed inside <Container>
 * @param {string} [props.className] - Optional extra CSS class names
 */
const Container = ({ children, className = '' }) => {
  return (
    <div className={`container ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Container;
