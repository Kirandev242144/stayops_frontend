import React, { useState } from 'react';
import { 
  FiGrid, 
  FiCalendar, 
  FiDollarSign, 
  FiCheckSquare, 
  FiMenu,
  FiX,
  FiBook,
  FiHome,
  FiMonitor,
  FiUsers,
  FiSettings,
  FiHelpCircle
} from 'react-icons/fi';
import './MobileBottomNav.css';

export default function MobileBottomNav({ activePage, setActivePage }) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsMoreMenuOpen(false);
  };

  const moreMenuItems = [
    { id: 'reservations', label: 'Reservations', icon: FiBook },
    { id: 'properties', label: 'Properties', icon: FiHome },
    { id: 'storefront', label: 'Storefront Studio', icon: FiMonitor },
    { id: 'team', label: 'Team & Staff', icon: FiUsers },
    { id: 'settings', label: 'Settings', icon: FiSettings },
    { id: 'help', label: 'Help & Guides', icon: FiHelpCircle },
  ];

  return (
    <>
      {/* NATIVE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'overview' ? 'active' : ''}`}
          onClick={() => handleNavClick('overview')}
        >
          <div className="mobile-nav-icon-wrap">
            <FiGrid size={20} />
          </div>
          <span className="mobile-nav-label">Overview</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'calendar' ? 'active' : ''}`}
          onClick={() => handleNavClick('calendar')}
        >
          <div className="mobile-nav-icon-wrap">
            <FiCalendar size={20} />
          </div>
          <span className="mobile-nav-label">Calendar</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'pettycash' ? 'active' : ''}`}
          onClick={() => handleNavClick('pettycash')}
        >
          <div className="mobile-nav-icon-wrap">
            <FiDollarSign size={20} />
          </div>
          <span className="mobile-nav-label">Petty Cash</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'housekeeping' || activePage === 'frontdesk' ? 'active' : ''}`}
          onClick={() => handleNavClick('frontdesk')}
        >
          <div className="mobile-nav-icon-wrap">
            <FiCheckSquare size={20} />
          </div>
          <span className="mobile-nav-label">Front Desk</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${isMoreMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          aria-expanded={isMoreMenuOpen}
        >
          <div className="mobile-nav-icon-wrap">
            {isMoreMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </div>
          <span className="mobile-nav-label">More</span>
        </button>
      </nav>

      {/* MORE MENU NATIVE BOTTOM SHEET */}
      {isMoreMenuOpen && (
        <div 
          className="mobile-more-overlay"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className="mobile-more-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-drag-handle" />
            <div className="mobile-sheet-header">
              <h3>All Management Tools</h3>
              <button 
                type="button" 
                className="mobile-sheet-close"
                onClick={() => setIsMoreMenuOpen(false)}
                aria-label="Close menu"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="mobile-more-grid">
              {moreMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isItemActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`mobile-more-card ${isItemActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <div className="mobile-more-icon-box">
                      <IconComponent size={22} />
                    </div>
                    <span className="mobile-more-card-title">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
