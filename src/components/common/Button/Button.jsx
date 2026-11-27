import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Text or icons inside button
 * @param {'primary' | 'secondary' | 'outline'} [props.variant='primary'] - Button style variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button sizing
 * @param {Function} [props.onClick] - Click event handler
 * @param {string} [props.type='button'] - Button HTML type attribute
 * @param {string} [props.className] - Custom additional classes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
