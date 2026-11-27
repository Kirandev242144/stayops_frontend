import "./Sidebar.css";
import logo from "../../../assets/logo/stayops-logo.png";
import collapsedLogo from "../../../assets/logo/logo-sidebar-collapsed.png";

const SidebarLogo = ({ collapsed }) => {
    return (
        <div className="sidebar-logo">
            <img
                src={collapsed ? collapsedLogo : logo}
                alt="StayOps"
            />
        </div>
    );
};

export default SidebarLogo;