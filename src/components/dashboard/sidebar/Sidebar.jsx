import "./Sidebar.css";

import SidebarLogo from "./SidebarLogo";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import TrialCard from "./TrialCard";
import LogoutButton from "./LogoutButton";

import { sidebarMenu } from "./menuData";

const Sidebar = ({
  collapsed,
  setCollapsed,
  activePage,
  setActivePage
}) => {
  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : ""}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >

      {/* Logo */}
      <SidebarLogo collapsed={collapsed} />

      {/* Sidebar Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(true)}
        aria-label="Collapse sidebar"
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Sidebar Navigation */}
      <div className="sidebar-body">

        {sidebarMenu.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            collapsed={collapsed}
          >
            {section.items.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                collapsed={collapsed}
                active={activePage === item.id}
                onClick={() => setActivePage(item.id)}
              />
            ))}
          </SidebarSection>
        ))}

      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">

        {/* <TrialCard
          isTrial={true}
          planName="Pro Growth"
          trialDaysLeft={14}
          amountToday={0}
          progress={78}
          collapsed={collapsed}
        /> */}

        <LogoutButton
          collapsed={collapsed}
        />

      </div>

    </aside>
  );
};

export default Sidebar;