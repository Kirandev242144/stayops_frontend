import React, { useState, useEffect, useRef } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import NotificationBell from "./NotificationBell";
import NotificationDropdown from "./NotificationDropdown";
import "./notifications.css";

export default function NotificationCenter({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    onNavigate: contextNavigate
  } = useNotifications();

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (notification) => {
    setIsOpen(false);
    const navFn = onNavigate || contextNavigate;
    if (navFn && notification.actionTab) {
      navFn(notification.actionTab);
    }
  };

  return (
    <div className="notif-center-wrapper" ref={containerRef}>
      <NotificationBell
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClick={handleToggle}
      />

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismissNotification}
          onClearAll={clearAll}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
