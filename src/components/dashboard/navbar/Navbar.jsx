import "./Navbar.css";
import Greeting from "./Greeting";
import NavbarActions from "./NavbarActions";
import logo from "../../../assets/logo/logo-sidebar-collapsed.png";

const Navbar = ({ collapsed }) => {
  return (
    <header
      className={`dashboard-navbar ${
        collapsed ? "navbar-collapsed" : ""
      }`}
    >
      <div className="navbar-mobile-brand">
        <img src={logo} alt="StayOps" className="navbar-mobile-logo" />
        <span className="navbar-mobile-brand-name">StayOps</span>
      </div>

      <div className="navbar-desktop-greeting">
        <Greeting />
      </div>

      <NavbarActions />
    </header>
  );
};

export default Navbar;