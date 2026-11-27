import { actionButtons } from "./navbarData";
import NotificationCenter from "../notifications/NotificationCenter";

const ActionButtons = () => {
  return (
    <div className="navbar-buttons">
      {actionButtons.map((item) => {
        // Render rich interactive Notification Center for the bell item
        if (item.id === 3 || item.notification) {
          return <NotificationCenter key={item.id} />;
        }

        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={`navbar-btn ${item.variant}`}
          >
            <Icon />

            {item.label && (
              <span>{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ActionButtons;
