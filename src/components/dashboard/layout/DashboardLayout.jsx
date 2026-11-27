import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import MobileBottomNav from "../navigation/MobileBottomNav";
import { useState } from "react";
import { NotificationProvider } from "../../../context/NotificationContext";
import "./DashboardLayout.css";

const DashboardLayout = ({
  children,
  activePage,
  setActivePage
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NotificationProvider onNavigate={setActivePage}>
      <div className={`dashboard-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <main className="dashboard-main">
          <Navbar collapsed={collapsed} />

          <div
            className="dashboard-content"
          >
            {children}
          </div>
        </main>

        {/* NATIVE PWA MOBILE BOTTOM NAVIGATION */}
        <MobileBottomNav
          activePage={activePage}
          setActivePage={setActivePage}
        />
      </div>
    </NotificationProvider>
  );
};

export default DashboardLayout;
