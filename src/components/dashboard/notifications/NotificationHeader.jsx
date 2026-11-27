import React from "react";
import { FiCheck, FiTrash2 } from "react-icons/fi";

export default function NotificationHeader({ unreadCount = 0, onMarkAllAsRead, onClearAll }) {
  return (
    <div className="notif-header">
      <div className="notif-header-left">
        <h3 className="notif-header-title">Notifications</h3>
        {unreadCount > 0 && (
          <span className="notif-unread-count-tag">
            {unreadCount} New
          </span>
        )}
      </div>

      <div className="notif-header-actions">
        {unreadCount > 0 && (
          <button
            type="button"
            className="notif-action-btn-ghost"
            onClick={onMarkAllAsRead}
            title="Mark all notifications as read"
          >
            <FiCheck size={14} /> Mark all read
          </button>
        )}

        <button
          type="button"
          className="notif-action-btn-ghost muted"
          onClick={onClearAll}
          title="Clear all notifications"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  );
}
