import React from "react";
import NotificationItem from "./NotificationItem";
import NotificationEmpty from "./NotificationEmpty";

export default function NotificationList({
  notifications = [],
  filter = "all",
  onMarkAsRead,
  onDismiss,
  onAction
}) {
  if (notifications.length === 0) {
    return <NotificationEmpty filter={filter} />;
  }

  return (
    <div className="notif-list-container">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
