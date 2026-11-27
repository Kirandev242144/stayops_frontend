import React from "react";
import "./CategoryHero.css";
import { FiHome, FiChevronRight, FiSearch, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import Container from "../../../../components/common/Container/Container";
import iconMap from "../../data/iconMap";

const CategoryHero = ({
  category,
  searchQuery = "",
  setSearchQuery,
  articleCount = 0,
}) => {
  if (!category) return null;

  const Icon = iconMap[category.icon] || FiHome;
  const color = category.color || "#04B3C0";

  return (
    <section className="hc-cat-hero" style={{ "--cat-accent": color }}>
      <div
        className="hc-cat-hero-glow"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, ${color}05 60%, transparent 80%)`,
        }}
      ></div>

      <Container>
        <div className="hc-cat-hero-inner">
          {/* Breadcrumbs */}
          <nav className="hc-cat-breadcrumbs">
            <Link to="/help" className="hc-cat-bc-link">
              <FiHome className="hc-cat-bc-home" />
              <span>Help Center</span>
            </Link>
            <FiChevronRight className="hc-cat-bc-sep" />
            <Link to="/help" className="hc-cat-bc-link">
              Categories
            </Link>
            <FiChevronRight className="hc-cat-bc-sep" />
            <span className="hc-cat-bc-current">{category.title}</span>
          </nav>

          {/* Badge */}
          <div className="hc-cat-badge-wrap">
            <div
              className="hc-cat-icon-box"
              style={{
                color: color,
                backgroundColor: `${color}18`,
                borderColor: `${color}35`,
              }}
            >
              <Icon />
            </div>
            <div className="hc-cat-tag">
              <span>Knowledge Track</span>
              <span className="hc-cat-tag-dot">•</span>
              <span className="hc-cat-count-txt">
                {articleCount} {articleCount === 1 ? "Guide" : "Guides"}
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="hc-cat-title">{category.title}</h1>
          <p className="hc-cat-desc">{category.description}</p>

          {/* In-Category Search */}
          {setSearchQuery && (
            <div className="hc-cat-search-box">
              <FiSearch className="hc-cat-search-icon" />
              <input
                type="text"
                className="hc-cat-search-input"
                placeholder={`Search within ${category.title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="hc-cat-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear filter"
                >
                  <FiX />
                </button>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default CategoryHero;