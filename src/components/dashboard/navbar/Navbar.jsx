import "./Navbar.css";

import Greeting from "./Greeting";
import NavbarActions from "./NavbarActions";

const Navbar = ({ collapsed }) => {
  return (
    <header
      className={`dashboard-navbar ${
        collapsed ? "navbar-collapsed" : ""
      }`}
    >
      <Greeting />

      <NavbarActions />
    </header>
  );
};

export default Navbar;