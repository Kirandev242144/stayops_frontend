import React from 'react';
import Container from '../../common/Container/Container';
import SectionTitle from '../../common/SectionTitle/SectionTitle';
import './Resources.css';

/**
 * Resources Section Component
 * Displays educational blogs, downloadable guides, and hospitality industry tips.
 */
const Resources = () => {
  const articles = [
    {
      emoji: '📈',
      category: 'REVENUE OPTIMIZATION',
      title: 'How to Increase Direct Homestay Bookings by 45% in 2026',
      desc: 'Discover practical techniques to convert OTAs traffic into direct guests on your own website.'
    },
    {
      emoji: '🏡',
      category: 'OPERATIONS GUIDE',
      title: 'The Ultimate Villa Operations Checklist for Owners',
      desc: 'A step-by-step framework covering staff scheduling, guest check-in automation, and maintenance.'
    },
    {
      emoji: '🤖',
      category: 'HOSPITALITY TECH',
      title: 'How AI Channel Managers Prevent Double Bookings',
      desc: 'Learn how instant 2-way calendar sync keeps your rates updated across Airbnb and Booking.com.'
    }
  ];

  return (
    <section id="resources" className="resources-section section-padding">
      <Container>
        <SectionTitle
          badge="LEARNING HUB"
          title="Industry Insights &"
          gradientTitle="Hospitality Guides"
          subtitle="Empowering homestay and villa owners with strategies to increase occupancy and streamline daily management."
        />

        <div className="resources-grid">
          {articles.map((item, idx) => (
            <div key={idx} className="glass-card resource-card">
              <div className="resource-image-placeholder">{item.emoji}</div>
              <div className="resource-body">
                <span className="resource-category">{item.category}</span>
                <h3 className="resource-title">{item.title}</h3>
                <p className="resource-desc">{item.desc}</p>
                <a href="#read" className="resource-read-link">
                  Read Full Guide ➔
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Resources;
