const SidebarItem = ({
  icon,
  label,
  badge,
  active = false,
  onClick,
  collapsed,
}) => {
  return (
    <button
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={onClick}
      title={collapsed ? label : ""}
    >

      <div className="sidebar-item-left">

        <span className="sidebar-icon">
          {icon}
        </span>

        {!collapsed && (
          <span className="sidebar-label">
            {label}
          </span>
        )}

      </div>

      {!collapsed && badge && (
        <span className="sidebar-badge">
          {badge}
        </span>
      )}

    </button>
  );
};

export default SidebarItem;