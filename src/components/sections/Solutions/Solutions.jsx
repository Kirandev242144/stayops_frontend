import React from 'react';
import Container from '../../common/Container/Container';
import SectionTitle from '../../common/SectionTitle/SectionTitle';
import './Solutions.css';

/**
 * Solutions Section Component
 * Tailored workflows for Homestays, Villas, Boutique Resorts, and Vacation Rental operators.
 */
const Solutions = () => {
  const propertyTypes = [
    {
      emoji: '🏡',
      title: 'Homestays & B&Bs',
      desc: 'Simplify daily guest check-ins, breakfast orders, and local tour booking add-ons with an intuitive mobile dashboard.',
      features: ['Personalized guest messaging', 'Meal operation tracking', 'Offline payment logs']
    },
    {
      emoji: '🏝️',
      title: 'Luxury Villas & Chalets',
      desc: 'Deliver white-glove hospitality with custom direct booking sites, deposit management, and concierge service integrations.',
      features: ['Custom branded website', 'Security deposit holds', 'Staff task assignment']
    },
    {
      emoji: '⛰️',
      title: 'Boutique Resorts',
      desc: 'Automate multi-room inventory, seasonal tier pricing, and channel syncing across top travel booking engines.',
      features: ['Multi-room inventory sync', 'OTA rate parity tools', 'Financial P&L reports']
    },
    {
      emoji: '🏢',
      title: 'Vacation Rental Chains',
      desc: 'Scale property portfolios effortlessly with centralized owner accounts, multi-property calendars, and permission roles.',
      features: ['Multi-property view', 'Role-based access control', 'Automated owner payouts']
    }
  ];

  return (
    <section id="solutions" className="solutions-section section-padding">
      <Container>
        <SectionTitle
          badge="TAILORED SOLUTIONS"
          title="Designed for every type of"
          gradientTitle="Hospitality Business"
          subtitle="Whether managing a single cozy hillside homestay or a portfolio of 30 luxury beachfront villas, StayOps fits your exact workflow."
        />

        <div className="solutions-grid">
          {propertyTypes.map((item, idx) => (
            <div key={idx} className="glass-card solution-card">
              <div className="solution-badge">{item.emoji}</div>
              <h3 className="solution-title">{item.title}</h3>
              <p className="solution-desc">{item.desc}</p>
              <a href="#pricing" className="solution-link">
                Explore Solution ➔
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Solutions;
