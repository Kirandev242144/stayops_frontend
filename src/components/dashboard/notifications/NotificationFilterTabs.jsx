import React from "react";

export default function NotificationFilterTabs({
  activeFilter = "all",
  onSelectFilter,
  counts = { all: 0, late: 0, urgent: 0, unread: 0 }
}) {
  return (
    <div className="notif-tabs-bar">
      <button
        type="button"
        className={`notif-tab-pill ${activeFilter === "all" ? "active" : ""}`}
        onClick={() => onSelectFilter("all")}
      >
        <span>All</span>
        {counts.all > 0 && <span className="notif-tab-count">{counts.all}</span>}
      </button>

      {counts.departures > 0 && (
        <button
          type="button"
          className={`notif-tab-pill ${activeFilter === "departures" ? "active" : ""}`}
          onClick={() => onSelectFilter("departures")}
        >
          <span>Departures</span>
          <span className="notif-tab-count">{counts.departures}</span>
        </button>
      )}

      {counts.late > 0 && (
        <button
          type="button"
          className={`notif-tab-pill ${activeFilter === "late" ? "active" : ""}`}
          onClick={() => onSelectFilter("late")}
        >
          <span>Late Arrivals</span>
          <span className="notif-tab-count">{counts.late}</span>
        </button>
      )}

      {counts.urgent > 0 && (
        <button
          type="button"
          className={`notif-tab-pill ${activeFilter === "urgent" ? "active" : ""}`}
          onClick={() => onSelectFilter("urgent")}
        >
          <span>Urgent</span>
          <span className="notif-tab-count">{counts.urgent}</span>
        </button>
      )}

      {counts.payments > 0 && (
        <button
          type="button"
          className={`notif-tab-pill ${activeFilter === "payments" ? "active" : ""}`}
          onClick={() => onSelectFilter("payments")}
        >
          <span>Payments</span>
          <span className="notif-tab-count">{counts.payments}</span>
        </button>
      )}

      {counts.unread > 0 && (
        <button
          type="button"
          className={`notif-tab-pill ${activeFilter === "unread" ? "active" : ""}`}
          onClick={() => onSelectFilter("unread")}
        >
          <span>Unread</span>
          <span className="notif-tab-count">{counts.unread}</span>
        </button>
      )}
    </div>
  );
}
