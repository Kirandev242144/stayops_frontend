import React from "react";
import { FiCheckCircle } from "react-icons/fi";

export default function NotificationEmpty({ filter = "all" }) {
  const messages = {
    all: {
      title: "All Caught Up!",
      desc: "No active operational alerts or late arrivals."
    },
    late: {
      title: "No Late Arrivals",
      desc: "All scheduled arrivals for today are within regular hours."
    },
    urgent: {
      title: "No Urgent Issues",
      desc: "There are currently no high-priority alerts."
    },
    payments: {
      title: "No Payment Alerts",
      desc: "No recent payments recorded."
    },
    unread: {
      title: "No Unread Notifications",
      desc: "You have reviewed all current operational notifications."
    }
  };

  const { title, desc } = messages[filter] || messages.all;

  return (
    <div className="notif-empty-box">
      <div className="notif-empty-icon">
        <FiCheckCircle />
      </div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
