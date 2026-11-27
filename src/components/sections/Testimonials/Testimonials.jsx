import React from 'react';
import Container from '../../common/Container/Container';
import SectionTitle from '../../common/SectionTitle/SectionTitle';
import './Testimonials.css';

/**
 * Testimonials Section Component
 * Customer success stories and reviews from real property owners.
 */
const Testimonials = () => {
  const reviews = [
    {
      stars: '★★★★★',
      quote: '"Switching to StayOps saved us over $1,200 a month in OTA commissions. Our direct website bookings grew from 10% to 60% within 3 months!"',
      name: 'Rohan Sharma',
      property: 'Owner, Misty Hills Villa (Manali)',
      avatar: 'R'
    },
    {
      stars: '★★★★★',
      quote: '"Managing 12 luxury beachfront chalets used to be a double-booking nightmare. StayOps iCal channel sync updated Airbnb and Booking.com in seconds."',
      name: 'Elena Rostova',
      property: 'Manager, Azure Palms Resort (Goa)',
      avatar: 'E'
    },
    {
      stars: '★★★★★',
      quote: '"The guest breakfast and expense tracking module is incredible. My staff now records everything on their phone with zero confusion."',
      name: 'Vikramaditya Singh',
      property: 'Host, Heritage Homestay (Jaipur)',
      avatar: 'V'
    }
  ];

  return (
    <section className="testimonials-section section-padding">
      <Container>
        <SectionTitle
          badge="TRUSTED BY HOSTS"
          title="Loved by 500+ Property Owners"
          gradientTitle="Worldwide"
          subtitle="Read how StayOps helps boutique hosts and resort managers automate operations and boost profit margins."
        />

        <div className="testimonials-grid">
          {reviews.map((item, idx) => (
            <div key={idx} className="glass-card testimonial-card">
              <div className="stars-row">{item.stars}</div>
              <p className="testimonial-quote">{item.quote}</p>
              <div className="owner-profile">
                <div className="owner-avatar">{item.avatar}</div>
                <div className="owner-info">
                  <h4>{item.name}</h4>
                  <p>{item.property}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Testimonials;
