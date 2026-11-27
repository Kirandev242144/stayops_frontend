import { useEffect, useRef } from "react";
import gsap from "gsap";

import "./Hero.css";

import Container from "../../common/Container/Container";
import Button from "../../common/Button/Button";

import HeroImage from "../../../assets/heroimage/hero.png";

function Hero() {

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
            }, "-=0.8");

            // Floating Hero Image
            gsap.to(".hero-image", {
                y: -10,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "ease.inOut",
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
                           <Button variant="primary">
                                Start Free Trial
                            </Button>

                            <Button variant="secondary">
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

                        <img
                            src={HeroImage}
                            alt="Luxury Villa"
                            className="hero-image"
                        />

                    </div>

                </div>

            </Container>
        </section>
    );
}

export default Hero;