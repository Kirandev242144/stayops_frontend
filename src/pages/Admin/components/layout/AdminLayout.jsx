import React, { useState } from "react";
import AdminSidebar from "../sidebar/AdminSidebar";
import AdminNavbar from "../navbar/AdminNavbar";
import "./AdminLayout.css";

const AdminLayout = ({
  children,
  activePage,
  setActivePage,
  onLogout,
  onRefresh,
  isRefreshing,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Dedicated Admin Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={onLogout}
      />

      {/* Main Admin Viewport */}
      <main className="admin-main">
        {/* Dedicated Admin Top Navbar */}
        <AdminNavbar
          collapsed={collapsed}
          activePage={activePage}
          setActivePage={setActivePage}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onLogout={onLogout}
        />

        {/* Content Shell */}
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
