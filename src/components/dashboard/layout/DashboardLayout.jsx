import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
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
            style={{
              paddingTop: "100px",
              paddingLeft: "24px",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default DashboardLayout;
