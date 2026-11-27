import React from "react";
import Logo from "../../../../assets/logo/stayops-logo.png";
import LogoCollapsed from "../../../../assets/logo/logo-sidebar-collapsed.png";
import { FiLogOut, FiShield } from "react-icons/fi";
import { adminMenuData } from "../../adminMenuData";
import "./AdminSidebar.css";

const AdminSidebar = ({
  collapsed,
  setCollapsed,
  activePage,
  setActivePage,
  onLogout,
}) => {
  return (
    <aside
      className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      aria-label="Admin console navigation"
    >
      {/* Brand & Badge */}
      <div className="admin-sidebar__logo-wrap">
        <div className="admin-sidebar__logo">
          {collapsed ? (
            <img src={LogoCollapsed} alt="StayOps" className="logo-collapsed" />
          ) : (
            <div className="logo-full-wrap">
              <img src={Logo} alt="StayOps" className="logo-full" />
            </div>
          )}
        </div>

        {/* <button
          type="button"
          className="admin-sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "›" : "‹"}
        </button> */}
      </div>

      {/* Navigation Sections */}
      <div className="admin-sidebar__body">
        {adminMenuData.map((section) => (
          <div key={section.title} className="admin-sidebar__section">
            {!collapsed && (
              <span className="admin-sidebar__section-title">
                {section.title}
              </span>
            )}

            <div className="admin-sidebar__items">
              {section.items.map((item) => {
                const isActive =
                  activePage === item.id ||
                  (item.id === "tenants" && activePage === "tenant-detail") ||
                  (item.id === "properties" && activePage === "property-detail") ||
                  (item.id === "leads" && activePage === "lead-detail");
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-sidebar__item ${
                      isActive ? "is-active" : ""
                    }`}
                    onClick={() => setActivePage(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="admin-sidebar__item-left">
                      <span className="admin-sidebar__icon">{item.icon}</span>
                      {!collapsed && (
                        <span className="admin-sidebar__label">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={`admin-sidebar__badge ${
                          item.badgeType === "success" ? "badge-success" : ""
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Admin Profile & Logout */}
      <div className="admin-sidebar__footer">
        {!collapsed ? (
          <div className="admin-sidebar__user-box">
            <div className="admin-sidebar__avatar">
              <FiShield size={16} />
            </div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">Root Admin</span>
              <span className="admin-sidebar__user-role">Platform Operator</span>
            </div>
            <button
              type="button"
              className="admin-sidebar__logout-btn"
              onClick={onLogout}
              title="Sign out of Admin Console"
              aria-label="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="admin-sidebar__logout-btn collapsed"
            onClick={onLogout}
            title="Sign out"
            aria-label="Logout"
          >
            <FiLogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
