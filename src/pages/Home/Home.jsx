import React, { useEffect } from 'react';
import Container from '../../components/common/Container/Container';
import './Home.css';
import Hero from "../../components/sections/Hero/Hero";
import Features from '../../components/sections/Features/Features';
import PlatformIntegrations from '../../components/sections/PlatformIntegrations/PlatformIntegrations';
import Problem from '../../components/sections/Problem/Problem';
import Hero2 from "../../components/sections/Hero2/Hero2";
import BookDemoSection from "../../components/sections/BookDemoSection/BookDemoSection";

function Home() {
  useEffect(() => {
    // If arriving with #book-demo in URL
    if (window.location.hash === "#book-demo") {
      setTimeout(() => {
        const el = document.getElementById("book-demo");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }

    // Listen for custom open-book-demo event to scroll
    const handleScrollEvent = () => {
      const el = document.getElementById("book-demo");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("open-book-demo", handleScrollEvent);
    return () => window.removeEventListener("open-book-demo", handleScrollEvent);
  }, []);

  return (
    <>
      {/* <Hero />  */}
      <Hero2 /> 
      <PlatformIntegrations />
      <Problem />
      <BookDemoSection />
    </>
  );
}

export default Home;
