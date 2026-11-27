import React from "react";
import { FiClock, FiAlertCircle, FiX, FiArrowRight, FiCheckCircle, FiLogOut } from "react-icons/fi";

function formatRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onAction
}) {
  const isCheckout = notification.type === "checkout" || notification.category === "checkout";
  const isPayment = (notification.type === "payment" || notification.category === "payment") && !isCheckout;
  const isUrgent = notification.priority === "urgent" || notification.type === "no_show";

  const renderIcon = () => {
    if (isCheckout) return <FiLogOut size={13} className="notif-svg-checkout" />;
    if (isPayment) return <FiCheckCircle size={13} className="notif-svg-payment" />;
    if (isUrgent) return <FiAlertCircle size={13} className="notif-svg-urgent" />;
    return <FiClock size={13} className="notif-svg-late" />;
  };

  const getIconWrapClass = () => {
    if (isCheckout) return "notif-item-icon-wrap icon-checkout";
    if (isPayment) return "notif-item-icon-wrap icon-payment";
    if (isUrgent) return "notif-item-icon-wrap icon-urgent";
    return "notif-item-icon-wrap icon-late";
  };

  const handleCardClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (onAction) {
      onAction(notification);
    }
  };

  const handleDismissClick = (e) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  return (
    <div
      className={`notif-item ${notification.read ? "read" : "unread"}`}
      onClick={handleCardClick}
    >
      <div className={getIconWrapClass()}>
        {renderIcon()}
      </div>

      <div className="notif-item-content">
        <div className="notif-item-header">
          <div className="notif-item-header-left">
            <h4 className="notif-item-title">{notification.title}</h4>
            {!notification.read && <span className="notif-unread-dot" title="Unread"></span>}
          </div>
          <span className="notif-item-time">{formatRelativeTime(notification.timestamp)}</span>
        </div>

        <p className="notif-item-msg">{notification.message}</p>

        <div className="notif-item-footer">
          <div className="notif-item-meta">
            {notification.meta?.roomUnit && (
              <span className="notif-meta-text notif-meta-room">{notification.meta.roomUnit}</span>
            )}
            {notification.meta?.departureTime && (
              <>
                <span className="notif-meta-sep">•</span>
                <span className="notif-meta-text notif-meta-time">Departed {notification.meta.departureTime}</span>
              </>
            )}
            {notification.meta?.amount !== undefined && notification.meta?.amount !== null && Number(notification.meta.amount) > 0 && (
              <>
                <span className="notif-meta-sep">•</span>
                <span className="notif-meta-amount">₹{Number(notification.meta.amount).toLocaleString('en-IN')}</span>
              </>
            )}
            {notification.meta?.paymentMode && (
              <>
                <span className="notif-meta-sep">•</span>
                <span className="notif-meta-mode">{notification.meta.paymentMode}</span>
              </>
            )}
            {notification.meta?.checkInTime && !notification.meta?.departureTime && (
              <>
                <span className="notif-meta-sep">•</span>
                <span className="notif-meta-text">{notification.meta.checkInTime}</span>
              </>
            )}
            {notification.meta?.isOverdue && (
              <>
                <span className="notif-meta-sep">•</span>
                <span className="notif-meta-overdue">Overdue</span>
              </>
            )}
          </div>

          <div className="notif-item-actions">
            {notification.actionLabel && (
              <button
                type="button"
                className="notif-action-btn-clean"
                onClick={handleActionClick}
              >
                <span>{notification.actionLabel}</span>
                <FiArrowRight size={11} />
              </button>
            )}

            <button
              type="button"
              className="notif-btn-icon-dismiss"
              onClick={handleDismissClick}
              title="Dismiss notification"
            >
              <FiX size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
