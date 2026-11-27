import { useEffect } from "react";
import "./PlatformIntegrations.css";

import Container from "../../common/Container/Container";
import SectionTitle from "../../common/SectionTitle/SectionTitle";

const platforms = [
  { name: "Booking.com", color: "#003580" },
  { name: "Airbnb", color: "#FF385C" },
  { name: "Expedia", color: "#003580" },
  { name: "Agoda", color: "#5A2D82" },
  { name: "Vrbo", color: "#245ABC" },
  { name: "Google", color: "#4285F4" },
];

function PlatformIntegrations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    const elements = document.querySelectorAll("[data-fade]");

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="platforms">
      <Container>
        <div className="pm-head" data-fade>

          <SectionTitle
            title="Your guests are already on these platforms"
            subtitle="Connect Airbnb, Booking.com, Agoda, and more. Every booking lands in one calendar with zero double bookings."
          />

        </div>
      </Container>

      <div
        className="pm-track-wrap"
        role="region"
        aria-label="Connected booking platforms"
      >
        <div className="pm-track">

          {[...platforms, ...platforms, ...platforms].map(
            (platform, index) => (
              <div
                key={index}
                className="pm-card"
                aria-hidden={index >= platforms.length * 2}
              >
                <span
                  className="pm-logo"
                  style={{ "--brand": platform.color }}
                >
                  {platform.name}
                </span>
              </div>
            )
          )}

        </div>
      </div>

      <Container>
        <p className="pm-foot">
          <strong>Zero double bookings</strong> — <p>every calendar updates the
          instant one platform confirms a reservation.</p>
        </p>
        
      </Container>
    </section>
  );
}

export default PlatformIntegrations;