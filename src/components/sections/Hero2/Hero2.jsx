import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";

import "./Hero2.css";

import Container from "../../common/Container/Container";
import Button from "../../common/Button/Button";

import HeroGirl from "../../../assets/heroimage/hero-girl.png";

function Hero2() {

    const heroRef = useRef(null);

    useEffect(() => {

        const ctx = gsap.context(() => {

            const tl = gsap.timeline({
                defaults: {
                    ease: "power3.out",
                },
            });

            tl.from(".hero-badge", {
                opacity: 0,
                y: 20,
                duration: 0.5,
            })

            .from(".hero-title", {
                opacity: 0,
                y: 40,
                duration: 0.8,
            }, "-=0.2")

            .from(".hero-description", {
                opacity: 0,
                y: 30,
                duration: 0.6,
            }, "-=0.4")

            .from(".hero-buttons", {
                opacity: 0,
                y: 20,
                duration: 0.5,
            }, "-=0.3")

            .from(".hero-users", {
                opacity: 0,
                y: 20,
                duration: 0.5,
            }, "-=0.3")

            .from(".hero-image", {
                opacity: 0,
                x: 80,
                scale: 0.95,
                duration: 1,
            }, "-=0.8")

            .from(".float-card", {
                opacity: 0,
                y: 24,
                scale: 0.92,
                duration: 0.55,
                stagger: 0.12,
            }, "-=0.5");

            // Gentle continuous float — girl image
            gsap.to(".hero-image", {
                y: -10,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Independent float loops per card so they drift out of sync
            const floatConfig = [
                { sel: ".fc-revenue", y: 8, duration: 3.4, delay: 0 },
                { sel: ".fc-bookings", y: 7, duration: 3.8, delay: 0.3 },
                { sel: ".fc-occupancy", y: 7, duration: 4.1, delay: 0.6 },
                { sel: ".fc-whatsapp", y: 8, duration: 3.6, delay: 0.15 },
                { sel: ".fc-checkin", y: 6, duration: 4.3, delay: 0.45 },
                { sel: ".fc-channels", y: 6, duration: 4.6, delay: 0.2 },
            ];

            floatConfig.forEach(({ sel, y, duration, delay }) => {
                gsap.to(sel, {
                    y: `-=${y}`,
                    duration,
                    delay,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            });

        }, heroRef);

        return () => ctx.revert();

    }, []);

    return (
        <section
            className="hero"
            ref={heroRef}
        >
            <Container>

                <div className="hero-wrapper">

                    {/* LEFT */}

                    <div className="hero-left">

                        <span className="hero-badge">
                            ─ Run Your Property from Anywhere. 🚀
                        </span>

                        <h1 className="hero-title">
                            Run Your Property.
                            <br />
                            Increase Direct
                            <br />
                            <span className="col-title">
                                Bookings.
                            </span>
                        </h1>

                        <p className="hero-description">
                            Manage bookings, availability, housekeeping,
                            guest communication, expenses, and direct bookings
                            from one platform while keeping your calendars
                            synchronized across OTAs.
                        </p>

                        <div className="hero-buttons">
                           <div className="buttons">
                           <Link to="/signup" style={{ textDecoration: "none" }}>
                             <Button variant="primary">
                                Start Free Trial
                             </Button>
                           </Link>

                            <Button
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById("book-demo");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth" });
                                } else {
                                  window.location.href = "/#book-demo";
                                }
                              }}
                            >
                                Book Demo
                            </Button>
                           </div>


                            <p>14-day free trial • No credit card required</p>

                        </div>

                        <div className="hero-users">

                            <div className="avatars">

                                <img src="https://i.pravatar.cc/40?img=1" alt="" />
                                <img src="https://i.pravatar.cc/40?img=2" alt="" />
                                <img src="https://i.pravatar.cc/40?img=3" alt="" />
                                <img src="https://i.pravatar.cc/40?img=4" alt="" />

                                <span className="count">
                                    +15
                                </span>

                            </div>

                            <p className="info">
                                Helping Hospitality Businesses Grow
                            </p>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="hero-right">

                        <div className="hero-visual">

                            <img
                                src={HeroGirl}
                                alt="Property owner checking bookings on her phone"
                                className="hero-image"
                            />

                            {/* Revenue */}
                            <div className="float-card fc-revenue">
                                <div className="fc-revenue-head">
                                    <span className="fc-card-label">Revenue</span>
                                    <span className="fc-period">
                                        This Month
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                    </span>
                                </div>
                                <div className="fc-revenue-row">
                                    <span className="fc-revenue-value">₹2,45,800</span>
                                    <span className="fc-trend up">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                                        24%
                                    </span>
                                </div>
                                <svg className="fc-sparkline" viewBox="0 0 220 56" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35"/>
                                            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0"/>
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,40 C20,42 30,20 48,24 C68,28 74,44 96,40 C118,36 122,10 146,14 C168,18 172,32 196,24 L212,8" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round"/>
                                    <path d="M0,40 C20,42 30,20 48,24 C68,28 74,44 96,40 C118,36 122,10 146,14 C168,18 172,32 196,24 L212,8 L212,56 L0,56 Z" fill="url(#sparkFill)" stroke="none"/>
                                    <circle cx="212" cy="8" r="4" fill="#0D9488"/>
                                </svg>
                            </div>

                            {/* Bookings */}
                            <div className="float-card fc-stat fc-bookings">
                                <span className="fc-icon fc-icon-blue">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                </span>
                                <div className="fc-stat-body">
                                    <span className="fc-card-label">Bookings</span>
                                    <span className="fc-stat-value">128</span>
                                    <span className="fc-stat-delta up">↑ 18% this month</span>
                                </div>
                            </div>

                            {/* Occupancy */}
                            <div className="float-card fc-stat fc-occupancy">
                                <span className="fc-icon fc-icon-orange">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18M5 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/></svg>
                                </span>
                                <div className="fc-stat-body">
                                    <span className="fc-card-label">Occupancy Rate</span>
                                    <span className="fc-stat-value">72%</span>
                                    <span className="fc-stat-delta up">↑ 12% vs last month</span>
                                </div>
                            </div>

                            {/* WhatsApp notification */}
                            <div className="float-card fc-notify fc-whatsapp">
                                <span className="fc-icon fc-icon-whatsapp">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.03-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.81c0 4.54-3.69 8.21-8.23 8.21z"/></svg>
                                </span>
                                <div className="fc-notify-body">
                                    <div className="fc-notify-top">
                                        <span className="fc-card-label">New Booking</span>
                                        <span className="fc-time">7m ago</span>
                                    </div>
                                    <span className="fc-notify-sub">via WhatsApp</span>
                                </div>
                            </div>

                            {/* Guests checked in */}
                            <div className="float-card fc-notify fc-checkin">
                                <span className="fc-icon fc-icon-teal">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </span>
                                <div className="fc-notify-body">
                                    <span className="fc-card-label">Guests Checked In</span>
                                    <span className="fc-checkin-value">8 <span className="fc-checkin-sub">Today</span></span>
                                </div>
                            </div>

                            {/* Top Channels */}
                            <div className="float-card fc-channels">
                                <span className="fc-card-label">Top Channels</span>

                                <div className="channel-row">
                                    <span className="channel-mark channel-airbnb">A</span>
                                    <span className="channel-name">Airbnb</span>
                                    <span className="channel-bar"><span style={{ width: "45%" }}></span></span>
                                    <span className="channel-pct">45%</span>
                                </div>

                                <div className="channel-row">
                                    <span className="channel-mark channel-booking">B</span>
                                    <span className="channel-name">Booking.com</span>
                                    <span className="channel-bar"><span style={{ width: "30%" }}></span></span>
                                    <span className="channel-pct">30%</span>
                                </div>

                                <div className="channel-row">
                                    <span className="channel-mark channel-direct">D</span>
                                    <span className="channel-name">Direct Website</span>
                                    <span className="channel-bar"><span style={{ width: "25%" }}></span></span>
                                    <span className="channel-pct">25%</span>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </Container>
        </section>
    );
}

export default Hero2;