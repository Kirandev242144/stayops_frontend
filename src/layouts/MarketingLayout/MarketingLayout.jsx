import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import './MarketingLayout.css';

/**
 * MarketingLayout Component
 * Serves as the outer template for marketing pages.
 * Incorporates the Navbar at top, Outlet (current page content) in middle, and Footer at bottom.
 */
const MarketingLayout = () => {
  return (
    <div className="marketing-wrapper">
      <Navbar />
      <main className="marketing-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
