import React, { useState, useMemo } from "react";
import NotificationHeader from "./NotificationHeader";
import NotificationFilterTabs from "./NotificationFilterTabs";
import NotificationList from "./NotificationList";

export default function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onAction
}) {
  const [filter, setFilter] = useState("all");

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      departures: notifications.filter(n => n.type === "checkout" || n.category === "checkout").length,
      late: notifications.filter(n => n.type === "late_arrival" || n.category === "late_arrival").length,
      urgent: notifications.filter(n => n.priority === "urgent" || n.type === "no_show").length,
      payments: notifications.filter(n => n.type === "payment" || n.category === "payment" || n.type === "checkout").length,
      unread: notifications.filter(n => !n.read).length
    };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "departures":
        return notifications.filter(n => n.type === "checkout" || n.category === "checkout");
      case "late":
        return notifications.filter(n => n.type === "late_arrival" || n.category === "late_arrival");
      case "urgent":
        return notifications.filter(n => n.priority === "urgent" || n.type === "no_show");
      case "payments":
        return notifications.filter(n => n.type === "payment" || n.category === "payment" || n.type === "checkout");
      case "unread":
        return notifications.filter(n => !n.read);
      case "all":
      default:
        return notifications;
    }
  }, [notifications, filter]);

  return (
    <div className="notif-dropdown-panel" onClick={e => e.stopPropagation()}>
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllAsRead={onMarkAllAsRead}
        onClearAll={onClearAll}
      />

      <NotificationFilterTabs
        activeFilter={filter}
        onSelectFilter={setFilter}
        counts={counts}
      />

      <NotificationList
        notifications={filteredNotifications}
        filter={filter}
        onMarkAsRead={onMarkAsRead}
        onDismiss={onDismiss}
        onAction={onAction}
      />

      <div className="notif-footer-bar">
        <span className="notif-footer-hint">Real-time operational alerts</span>
      </div>
    </div>
  );
}
