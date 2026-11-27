import React, { useRef, useEffect } from "react";
import "./HelpCenter.css";
import HelpCenterNavbar from "../../components/layout/HelpCenterNavbar/HelpCenterNavbar";
import Hero from "./Hsections/Hero/Hero";
import QuickAccess from "./Hsections/QuickAccess/QuickAccess";
import Categories from "./Hsections/Categories/Categories";
import PopularArticles from "./Hsections/PopularArticles/PopularArticles";
import HelpFaq from "./Hsections/HelpFaq/HelpFaq";
import SupportBanner from "./Hsections/SupportBanner/SupportBanner";
import Footer from "../../components/layout/Footer/Footer";

function HelpCenter() {
  const searchInputRef = useRef(null);

  // Global hotkey: Cmd+K or Ctrl+K focuses the search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="hc-page-wrapper">
      <HelpCenterNavbar onFocusSearch={handleFocusSearch} />
      <main>
        <Hero searchInputRef={searchInputRef} />
        <QuickAccess />
        <Categories />
        <PopularArticles />
        <HelpFaq />
        <SupportBanner />
      </main>
      <Footer />
    </div>
  );
}

export default HelpCenter;