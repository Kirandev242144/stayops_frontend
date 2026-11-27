import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({ collapsed }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove JWT
    localStorage.removeItem("token");

    // Optional: remove stored user information if you have it
    localStorage.removeItem("user");

    // Redirect to login
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <button
      type="button"
      className="logout-btn"
      title={collapsed ? "Logout" : ""}
      onClick={handleLogout}
    >
      <FiLogOut />

      {!collapsed && (
        <span>Logout</span>
      )}
    </button>
  );
};

export default LogoutButton;