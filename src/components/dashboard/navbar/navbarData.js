import {
  FiPlus,
  FiMoon,
  FiBell,
} from "react-icons/fi";

export const actionButtons = [
  {
    id: 1,
    label: "Quick Action",
    icon: FiPlus,
    variant: "primary",
  },

  {
    id: 2,
    icon: FiMoon,
    variant: "icon",
  },

  {
    id: 3,
    icon: FiBell,
    variant: "icon",
    notification: true,
  },
];