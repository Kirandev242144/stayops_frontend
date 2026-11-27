import React from "react";
import {
  FiGrid,
  FiHome,
  FiUsers,
  FiCreditCard,
  FiActivity,
  FiSettings,
  FiInbox,
} from "react-icons/fi";

export const adminMenuData = [
  {
    title: "Platform Core",
    items: [
      {
        id: "overview",
        label: "Overview & KPIs",
        icon: <FiGrid />,
      },
      {
        id: "leads",
        label: "Sales Leads",
        icon: <FiInbox />,
      },
      {
        id: "properties",
        label: "All Properties",
        icon: <FiHome />,
        badge: "142",
      },
      {
        id: "tenants",
        label: "Tenants & Users",
        icon: <FiUsers />,
        badge: "108",
      },
    ],
  },
  {
    title: "Revenue & Plans",
    items: [
      {
        id: "subscriptions",
        label: "Subscriptions & MRR",
        icon: <FiCreditCard />,
        badge: "₹2.48L",
      },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      {
        id: "system",
        label: "System & Webhooks",
        icon: <FiActivity />,
        badge: "Healthy",
        badgeType: "success",
      },
      {
        id: "settings",
        label: "Platform Settings",
        icon: <FiSettings />,
      },
    ],
  },
];
