import React from "react";
import { FiBell } from "react-icons/fi";

export default function NotificationBell({ unreadCount = 0, isOpen = false, onClick }) {
  return (
    <button
      type="button"
      className={`notif-bell-btn ${isOpen ? "active" : ""}`}
      onClick={onClick}
      aria-label={`Notifications, ${unreadCount} unread`}
      title={unreadCount > 0 ? `${unreadCount} unread operational alert(s)` : "Notifications"}
    >
      <FiBell className="notif-bell-icon" />

      {unreadCount > 0 && (
        <span className="notif-badge-pill">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
