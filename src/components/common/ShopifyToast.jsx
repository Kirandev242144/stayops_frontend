import React from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle } from 'react-icons/fi';
import '../../styles/shopify-toast.css';

/**
 * Custom Shopify Polaris Action Toast layout component
 */
function ShopifyToastContent({ message, actionLabel, onAction, closeToast }) {
  const handleAction = (e) => {
    e.stopPropagation();
    if (onAction) onAction();
    if (closeToast) closeToast();
  };

  return (
    <div className="shopify-toast-content">
      <span className="shopify-toast-message">{message}</span>
      {actionLabel && (
        <button type="button" className="shopify-toast-action-btn" onClick={handleAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Shopify-styled Toast API wrapper wrapping react-toastify
 */
export const shopifyToast = {
  success(message, options = {}) {
    return toast.success(message, {
      icon: <FiCheckCircle size={18} style={{ color: '#10b981' }} />,
      ...options,
    });
  },

  error(message, options = {}) {
    return toast.error(message, {
      icon: <FiXCircle size={18} style={{ color: '#f87171' }} />,
      ...options,
    });
  },

  warning(message, options = {}) {
    return toast.warning(message, {
      icon: <FiAlertTriangle size={18} style={{ color: '#fbbf24' }} />,
      ...options,
    });
  },

  info(message, options = {}) {
    return toast.info(message, {
      icon: <FiInfo size={18} style={{ color: '#60a5fa' }} />,
      ...options,
    });
  },

  /**
   * Action Toast with an inline button (e.g. "Undo", "View Details", "Retry")
   */
  action(message, actionLabel, onAction, options = {}) {
    const type = options.type || 'info';
    const toastFn = toast[type] || toast;

    return toastFn(
      ({ closeToast }) => (
        <ShopifyToastContent
          message={message}
          actionLabel={actionLabel}
          onAction={onAction}
          closeToast={closeToast}
        />
      ),
      {
        autoClose: 5000,
        ...options,
      }
    );
  },

  dismiss(toastId) {
    toast.dismiss(toastId);
  }
};

export default shopifyToast;
