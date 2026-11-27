import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Container from "../../common/Container/Container";
import Button from "../../common/Button/Button";
import stayopsLogo from "../../../assets/logo/stayops-logo.png";
import MegaMenu from "./MegaMenu/MegaMenu";
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleScrollToDemo = (e) => {
    if (e) e.preventDefault();
    if (isMobileOpen) setIsMobileOpen(false);

    const demoElement = document.getElementById("book-demo");
    if (demoElement) {
      demoElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#book-demo";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <Container className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src={stayopsLogo} alt="StayOps Logo" />
        </Link>

        {/* Navigation */}
        <nav className="nav-links">
          <a href="#features" className="nav-link">
            Features
          </a>

          <div
            className="mega-wrapper"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <a href="#solutions" className="nav-link">
              Solutions
            </a>
            <MegaMenu isOpen={isMenuOpen} />
          </div>

          <a href="#pricing" className="nav-link">
            Pricing
          </a>

          <a href="#resources" className="nav-link">
            Resources
          </a>
        </nav>

        {/* Desktop Buttons */}
        <div className="navbar-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrollToDemo}
          >
            Book Demo
          </Button>

          <Link to="/login">
            <Button variant="primary" size="sm">
              Login
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileOpen ? "✕" : "☰"}
        </button>
      </Container>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="mobile-menu">
          <a
            href="#features"
            className="mobile-nav-link"
            onClick={toggleMobileMenu}
          >
            Features
          </a>

          <a
            href="#solutions"
            className="mobile-nav-link"
            onClick={toggleMobileMenu}
          >
            Solutions
          </a>

          <a
            href="#pricing"
            className="mobile-nav-link"
            onClick={toggleMobileMenu}
          >
            Pricing
          </a>

          <a
            href="#resources"
            className="mobile-nav-link"
            onClick={toggleMobileMenu}
          >
            Resources
          </a>

          <div className="mobile-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollToDemo}
            >
              Book Demo
            </Button>

            <Link to="/login" onClick={toggleMobileMenu}>
              <Button variant="primary" size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;