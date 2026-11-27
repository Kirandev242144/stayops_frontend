import React, { useState } from 'react';
import Container from '../../common/Container/Container';
import SectionTitle from '../../common/SectionTitle/SectionTitle';
import './Features.css';

/**
 * Features Section Component
 * Tabbed breakdown of PMS Owner Dashboard tools, Customer Website Builder, and Channel Manager.
 */
const Features = () => {
  // useState hook: keeps track of currently selected tab ('dashboard', 'website', 'channel')
  const [activeTab, setActiveTab] = useState('dashboard');

  const featureData = {
    dashboard: [
      {
        icon: '📅',
        title: 'Unified Multi-Calendar',
        desc: 'View all room bookings, check-ins, check-outs, and maintenance blocks across properties in one drag-and-drop calendar.'
      },
      {
        icon: '🏨',
        title: 'Room & Inventory Control',
        desc: 'Configure flexible room types, seasonal pricing rules, custom extra beds, and automated cleaning status tracking.'
      },
      {
        icon: '🍽️',
        title: 'Meal & Service Operations',
        desc: 'Manage guest breakfast preferences, room service orders, extra tour packages, and add-on billing seamlessly.'
      },
      {
        icon: '👥',
        title: 'Guest CRM & Passport Scan',
        desc: 'Store guest stay histories, ID documentation, VIP tags, and send automated WhatsApp/Email check-in instructions.'
      },
      {
        icon: '📊',
        title: 'Financial & Expense Reports',
        desc: 'Track daily cash flow, owner payouts, utility bills, and export one-click monthly profit & loss statements.'
      },
      {
        icon: '🔔',
        title: 'Smart Push Notifications',
        desc: 'Instant alerts on mobile for new bookings, guest inquiries, payment receipts, and upcoming room check-outs.'
      }
    ],
    website: [
      {
        icon: '🌐',
        title: 'Instant Booking Engine',
        desc: 'Get an automatically generated website for your stay with custom domain support, live availability, and photo galleries.'
      },
      {
        icon: '💳',
        title: 'Direct Payment Gateways',
        desc: 'Collect 100% upfront payments directly via Stripe, Razorpay, UPI, or Credit Cards with zero commission fees.'
      },
      {
        icon: '📱',
        title: 'Mobile-Optimized UX',
        desc: 'Superfast mobile booking experience designed to convert travelers on smartphones into confirmed direct guests.'
      }
    ],
    channel: [
      {
        icon: '🔄',
        title: 'Instant 2-Way iCal & API Sync',
        desc: 'Sync rates and room availability with Airbnb, Booking.com, Agoda, Expedia, and VRBO in real time to eliminate double bookings.'
      },
      {
        icon: '⚡',
        title: 'Central Rate Management',
        desc: 'Update prices once in StayOps and watch them automatically sync across all online travel agencies (OTAs) instantly.'
      },
      {
        icon: '🛡️',
        title: 'Overbooking Protection',
        desc: 'Automatic instant room block out across all channels as soon as a direct guest books on your website.'
      }
    ]
  };

  return (
    <section id="features" className="features-section section-padding">
      <Container>
        <SectionTitle
          badge="FEATURE SUITE"
          title="Everything you need to scale your"
          gradientTitle="Hospitality Operations"
          subtitle="Explore how StayOps combines powerful owner management tools with zero-commission direct booking websites."
        />

        {/* Tab Buttons Bar */}
        <div className="features-tabs">
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Owner Dashboard
          </button>
          <button
            className={`tab-button ${activeTab === 'website' ? 'active' : ''}`}
            onClick={() => setActiveTab('website')}
          >
            🌐 Customer Booking Website
          </button>
          <button
            className={`tab-button ${activeTab === 'channel' ? 'active' : ''}`}
            onClick={() => setActiveTab('channel')}
          >
            🔄 Channel Manager
          </button>
        </div>

        {/* Dynamic Feature Cards Grid */}
        <div className="features-grid">
          {featureData[activeTab].map((item, index) => (
            <div key={index} className="glass-card feature-card">
              <div className="feature-icon-wrapper">{item.icon}</div>
              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Features;
