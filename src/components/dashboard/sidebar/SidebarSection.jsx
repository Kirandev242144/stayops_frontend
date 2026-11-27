const SidebarSection = ({ title, children, collapsed }) => {
  return (
    <div className="sidebar-section">

      {!collapsed && (
        <h5 className="sidebar-title">
          {title}
        </h5>
      )}

      <div className="sidebar-section-items">
        {children}
      </div>

    </div>
  );
};

export default SidebarSection;