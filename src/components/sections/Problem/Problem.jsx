import { useEffect, useRef } from "react";
import "./Problem.css";
import Container from "../../common/Container/Container";
import SectionTitle from "../../common/SectionTitle/SectionTitle";

const Problem = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const elements = sectionRef.current.querySelectorAll("[data-fade]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="problem-section" ref={sectionRef}>
      <Container>

        <div className="section-head" data-fade>

          <div className="section-eyebrow">
          Why StayOps
          </div>
          <SectionTitle align="left"
            title="Running a property from another city
            breaks in three predictable ways"
            subtitle="Not hotel problems — the specific ways an owner-run
            homestay or villa breaks down when you're not the
            one standing in it."
          />
          

        </div>

        <div className="problem-grid">

          {/* CARD 1 */}

          <div className="problem-card" data-fade="1">

            <div className="problem-visual">

              <div className="pv-remote">

                <div className="pv-remote-row">

                  <div className="pv-node owner">

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
                    </svg>

                  </div>

                  <div className="pv-link">

                    <span className="pv-dash"></span>

                    <span className="pv-nosignal">

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                        <path d="M5 12.5a10 10 0 0 1 3-2.1" />
                        <path d="M19 12.5a10 10 0 0 0-2.3-2.7" />
                        <path d="M12 20h.01" />
                      </svg>

                    </span>

                    <span className="pv-dash"></span>

                  </div>

                  <div className="pv-node">

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 12l9-8 9 8" />
                      <path d="M5 10v10h14V10" />
                    </svg>

                  </div>

                </div>

                <div className="pv-labels">

                  <span className="pv-node-label">
                    Owner · Bangalore
                  </span>

                  <span className="pv-node-label">
                    Villa · Goa
                  </span>

                </div>

                <span className="pv-status-chip">
                  Last update: 3 days ago
                </span>

              </div>

            </div>

            <div className="problem-tag">
              Pain Point 01
            </div>

            <h3>
              Remote Management
            </h3>

            <p>
              Owners live in metros while properties sit in
              leisure destinations, creating weak real-time
              visibility into readiness and cash.
            </p>

          </div>

          {/* CARD 2 */}

          <div className="problem-card" data-fade="2">

            <div className="problem-visual">

              <div className="pv-compare">

                <div className="pv-screen pv-dense">

                  <span className="pv-screen-label">
                    Typical PMS
                  </span>

                  <div className="pv-line"></div>
                  <div className="pv-line"></div>
                  <div className="pv-line"></div>
                  <div className="pv-line"></div>
                  <div className="pv-line"></div>

                </div>

                <span className="pv-vs">
                  vs
                </span>

                <div className="pv-screen">

                  <span className="pv-screen-label">
                    StayOps Caretaker
                  </span>

                  <div className="pv-tile-grid">

                    {[1,2,3,4].map((item)=>(
                      <div className="pv-tile" key={item}>

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                        >
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>

                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>

            <div className="problem-tag">
              Pain Point 02
            </div>

            <h3>
              Staff Usability
            </h3>

            <p>
              Caretakers need low-text, mobile-first workflows
              in their own language, not a PMS built for a
              trained hotel front desk.
            </p>

          </div>

          {/* CARD 3 */}

          <div className="problem-card" data-fade="3">

            <div className="problem-visual">

              <div className="pv-calendar">

                <span className="pv-day-label">
                  Sat, 12 Jul
                </span>

                <div className="pv-bar airbnb">
                  Airbnb
                </div>

                <div className="pv-bar booking">
                  Booking.com
                </div>

                <span className="pv-conflict-badge">

                  <span className="dot"></span>

                  Double booked

                </span>

              </div>

            </div>

            <div className="problem-tag">
              Pain Point 03
            </div>

            <h3>
              Inventory Fragmentation
            </h3>

            <p>
              Split inventory across OTAs and direct channels
              creates double bookings and slow guest response
              times.
            </p>

          </div>

        </div>

      </Container>
    </section>
  );
};

export default Problem;