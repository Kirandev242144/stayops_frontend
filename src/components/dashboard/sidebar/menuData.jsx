import {
  FiGrid,
  FiInbox,
  FiHome,
  FiMonitor,
  FiRefreshCw,
  FiCalendar,
  FiBook,
  FiUsers,
  FiMessageCircle,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiDollarSign,
  FiCheckSquare,
  FiBarChart2,
} from "react-icons/fi";

export const sidebarMenu = [
  {
    title: "Workspace",

    items: [
      {
        id: "overview",
        label: "Overview",
        icon: <FiGrid />,
        path: "/dashboard",
      },

      {
        id: "inbox",
        label: "Unified Inbox",
        icon: <FiInbox />,
        path: "/dashboard/inbox",
        badge: "5 New",
      },

      {
        id: "properties",
        label: "Properties",
        icon: <FiHome />,
        path: "/dashboard/properties",
      },

      {
        id: "reservations",
        label: "Reservations",
        icon: <FiBook />,
        path: "/dashboard/reservations",
      },
      {
        id: "frontdesk",
        label: "Front Desk",
        icon: <FiLogOut />,
        path: "/dashboard/frontdesk",
      },

      {
        id: "storefront",
        label: "Storefront Studio",
        icon: <FiMonitor />,
        path: "/dashboard/storefront",
        badge: "Studio",
      },

      {
        id: "channels",
        label: "OTA Channels",
        icon: <FiRefreshCw />,
        path: "/dashboard/channels",
      },

      {
        id: "calendar",
        label: "Calendar & Sync",
        icon: <FiCalendar />,
        path: "/dashboard/calendar",
      },

      {
        id: "team",
        label: "Team & Staff",
        icon: <FiUsers />,
        path: "/dashboard/team",
      },

      {
        id: "pettycash",
        label: "Petty Cash Ledger",
        icon: <FiDollarSign />,
        path: "/dashboard/pettycash",
      },

      {
        id: "reports",
        label: "Financial Reports",
        icon: <FiBarChart2 />,
        path: "/dashboard/reports",
      },

      {
        id: "whatsapp",
        label: "WhatsApp Commerce",
        icon: <FiMessageCircle />,
        path: "/dashboard/whatsapp",
        badge: "3",
      },
    ],
  },

  

  {
    title: "Account",

    items: [
      {
        id: "settings",
        label: "Settings",
        icon: <FiSettings />,
        path: "/dashboard/settings",
      },

      {
        id: "help",
        label: "Help & Guides",
        icon: <FiHelpCircle />,
        path: "/dashboard/help",
      },
    ],
  },
];