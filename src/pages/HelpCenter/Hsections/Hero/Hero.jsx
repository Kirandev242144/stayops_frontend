import "./Hero.css";
import Container from "../../../../components/common/Container/Container";
import { useEffect, useState, useRef } from "react";
import { FiZap, FiSearch, FiX, FiArrowRight, FiBookOpen, FiFileText } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { getArticles } from "../../../../Services/articleService";
import { helpArticles } from "../../data/helpArticles";
import { helpCategories } from "../../data/helpCategories";

function Hero({ searchInputRef }) {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Load articles for fast client-side live search
  useEffect(() => {
    async function fetchSearchArticles() {
      try {
        const data = await getArticles();
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        } else {
          setArticles(helpArticles);
        }
      } catch (err) {
        setArticles(helpArticles);
      }
    }
    fetchSearchArticles();
  }, []);

  // Filter live results
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const matchedArticles = articles
      .filter((art) => {
        const titleMatch = art.title?.toLowerCase().includes(q);
        const summaryMatch = art.summary?.toLowerCase().includes(q);
        const catMatch = art.categoryId?.toLowerCase().includes(q);
        return titleMatch || summaryMatch || catMatch;
      })
      .slice(0, 5);

    const matchedCategories = helpCategories
      .filter((cat) => cat.title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q))
      .slice(0, 2);

    setResults({ articles: matchedArticles, categories: matchedCategories });
  }, [query, articles]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTopic = (topic) => {
    setQuery(topic);
    setIsFocused(true);
    if (searchInputRef?.current) {
      searchInputRef.current.focus();
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  const hasResults =
    results?.articles?.length > 0 || results?.categories?.length > 0;

  return (
    <section className="hc-hero">
      <div className="hc-hero-ambient-glow"></div>
      <div className="hc-hero-grid-pattern"></div>

      <Container>
        <div className="hc-hero-content">
          <div className="hc-hero-badge">
            <FiZap className="hc-hero-badge-icon" />
            <span className="hc-hero-badge-text">
              StayOps Knowledge Hub & Documentation
            </span>
          </div>

          <h1 className="hc-hero-title">
            How can we <span className="hc-title-gradient">help you</span> today?
          </h1>

          <p className="hc-hero-description">
            Explore step-by-step setup guides, caretaker mobile workflows, OTA synchronization,
            and direct WhatsApp commerce for Indian boutique stays.
          </p>

          {/* Search Bar Container */}
          <div className="hc-search-outer" ref={wrapperRef}>
            <div className={`hc-search-wrapper ${isFocused ? "focused" : ""}`}>
              <FiSearch className="hc-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="hc-search-input"
                placeholder="Search articles, guides, OTA sync, invoicing..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsFocused(true);
                }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button
                  type="button"
                  className="hc-search-clear"
                  onClick={handleClear}
                  title="Clear search"
                >
                  <FiX />
                </button>
              )}
              <div className="hc-search-kbd-hint">
                <kbd>ESC</kbd>
              </div>
            </div>

            {/* Live Search Suggestions Dropdown */}
            {isFocused && query.trim().length > 0 && (
              <div className="hc-search-dropdown">
                {hasResults ? (
                  <>
                    {results.categories?.length > 0 && (
                      <div className="hc-dropdown-group">
                        <div className="hc-dropdown-header">
                          <FiBookOpen className="hc-dropdown-icon" />
                          <span>Categories</span>
                        </div>
                        {results.categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/help/category/${cat.id}`}
                            className="hc-dropdown-item category-item"
                            onClick={() => setIsFocused(false)}
                          >
                            <div className="hc-dropdown-item-info">
                              <span className="hc-dropdown-item-title">{cat.title}</span>
                              <span className="hc-dropdown-item-desc">{cat.description}</span>
                            </div>
                            <FiArrowRight className="hc-dropdown-arrow" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.articles?.length > 0 && (
                      <div className="hc-dropdown-group">
                        <div className="hc-dropdown-header">
                          <FiFileText className="hc-dropdown-icon" />
                          <span>Guides & Articles</span>
                        </div>
                        {results.articles.map((art) => (
                          <Link
                            key={art.id}
                            to={`/help/article/${art.id}`}
                            className="hc-dropdown-item"
                            onClick={() => setIsFocused(false)}
                          >
                            <div className="hc-dropdown-item-info">
                              <div className="hc-dropdown-item-top">
                                <span className="hc-dropdown-category-tag">
                                  {art.categoryId?.replace("-", " ")}
                                </span>
                                {art.readTime && (
                                  <span className="hc-dropdown-time">{art.readTime}</span>
                                )}
                              </div>
                              <span className="hc-dropdown-item-title">{art.title}</span>
                            </div>
                            <FiArrowRight className="hc-dropdown-arrow" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="hc-dropdown-empty">
                    <p>No matching guides found for "{query}".</p>
                    <span>Try searching for "property", "caretaker", "airbnb", or "billing".</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Query Chips */}
          <div className="hc-popular-topics">
            <span className="hc-popular-label">Popular Searches:</span>
            <button
              type="button"
              className="hc-topic-chip"
              onClick={() => handleSelectTopic("property setup")}
            >
              🚀 Property Setup
            </button>
            <button
              type="button"
              className="hc-topic-chip"
              onClick={() => handleSelectTopic("caretaker")}
            >
              📱 Caretaker Workflow
            </button>
            <button
              type="button"
              className="hc-topic-chip"
              onClick={() => handleSelectTopic("airbnb")}
            >
              🔄 Airbnb & OTA Sync
            </button>
            <button
              type="button"
              className="hc-topic-chip"
              onClick={() => handleSelectTopic("whatsapp")}
            >
              💬 WhatsApp Direct
            </button>
            <button
              type="button"
              className="hc-topic-chip"
              onClick={() => handleSelectTopic("billing")}
            >
              💳 Billing & GST
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;