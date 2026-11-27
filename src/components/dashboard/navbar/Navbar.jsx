import "./Navbar.css";
import Greeting from "./Greeting";
import NavbarActions from "./NavbarActions";
import logo from "../../../assets/logo/logo-sidebar-collapsed.png";

const Navbar = ({ collapsed }) => {
  const propertyName = localStorage.getItem('stayops_current_property_name') || 
                       localStorage.getItem('selected_property_name') || 
                       'Grand Palace Resort';

  return (
    <header
      className={`dashboard-navbar ${
        collapsed ? "navbar-collapsed" : ""
      }`}
    >
      <div className="navbar-mobile-brand">
        <div className="navbar-mobile-logo-wrap">
          <img src={logo} alt="StayOps" className="navbar-mobile-logo" />
        </div>
        <div className="navbar-mobile-brand-text">
          <div className="navbar-mobile-title-row">
            <span className="navbar-mobile-brand-name">StayOps</span>
            <span className="navbar-mobile-brand-dot"></span>
          </div>
          <span className="navbar-mobile-property-name">{propertyName}</span>
        </div>
      </div>

      <div className="navbar-desktop-greeting">
        <Greeting />
      </div>

      <NavbarActions />
    </header>
  );
};

export default Navbar;
