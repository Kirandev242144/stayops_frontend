import React from 'react';
import Container from '../../common/Container/Container';
import './Footer.css';

/**
 * Footer Component
 * Standard layout footer with company overview, navigation links, and copyright info.
 */
const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <span>Stay<span className="text-gradient">Ops</span></span>
            </div>
            <p className="footer-description">
              The all-in-one Property Management System (PMS) empowering homestays, villas, resorts, and vacation rentals to automate operations and maximize direct bookings.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="footer-heading">Product</h4>
            <div className="footer-links">
              <a href="#features" className="footer-link">Multi-Calendar</a>
              <a href="#features" className="footer-link">Channel Manager</a>
              <a href="#features" className="footer-link">Website Builder</a>
              <a href="#features" className="footer-link">Guest Management</a>
              <a href="#features" className="footer-link">Revenue Analytics</a>
            </div>
          </div>

          {/* Solutions Links */}
          <div>
            <h4 className="footer-heading">Solutions</h4>
            <div className="footer-links">
              <a href="#solutions" className="footer-link">Homestays</a>
              <a href="#solutions" className="footer-link">Luxury Villas</a>
              <a href="#solutions" className="footer-link">Boutique Resorts</a>
              <a href="#solutions" className="footer-link">Vacation Rentals</a>
              <a href="#solutions" className="footer-link">Multi-Property Chains</a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="footer-heading">Company</h4>
            <div className="footer-links">
              <a href="#about" className="footer-link">About Us</a>
              <a href="#careers" className="footer-link">Careers</a>
              <a href="#contact" className="footer-link">Contact</a>
              <a href="#press" className="footer-link">Press Kit</a>
              <a href="#partners" className="footer-link">Partners</a>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="footer-heading">Legal</h4>
            <div className="footer-links">
              <a href="#privacy" className="footer-link">Privacy Policy</a>
              <a href="#terms" className="footer-link">Terms of Service</a>
              <a href="#security" className="footer-link">Security</a>
              <a href="#gdpr" className="footer-link">GDPR Compliance</a>
            </div>
          </div>
        </div>

        {/* Copyright Footer Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} StayOps Inc. All rights reserved.</p>
          <p>Made with ❤️ for hospitality owners worldwide.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
