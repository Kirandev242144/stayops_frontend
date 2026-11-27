import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategories } from "../../Services/categoryService";
import { getArticles } from "../../Services/articleService";
import { helpCategories } from "./data/helpCategories";
import { helpArticles } from "./data/helpArticles";
import CategoryHero from "./Hsections/CategoryHero/CategoryHero";
import HelpCenterNavbar from "../../components/layout/HelpCenterNavbar/HelpCenterNavbar";
import Container from "../../components/common/Container/Container";
import ArticleList from "./Hsections/ArticleList/ArticleList";
import SupportBanner from "./Hsections/SupportBanner/SupportBanner";
import Footer from "../../components/layout/Footer/Footer";
import iconMap from "./data/iconMap";
import "./CategoryPage.css";
import { FiCheckCircle, FiLayers } from "react-icons/fi";

const CategoryPage = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const { categoryId } = useParams();
  // Default to getting-started if accessing /help/category without param
  const activeCategoryId = categoryId || "getting-started";

  // Reset search when category changes
  useEffect(() => {
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [categoryId]);

  useEffect(() => {
    async function loadData() {
      try {
        const [arts, cats] = await Promise.all([getArticles(), getCategories()]);
        setArticles(Array.isArray(arts) && arts.length > 0 ? arts : helpArticles);
        setCategories(Array.isArray(cats) && cats.length > 0 ? cats : helpCategories);
      } catch (err) {
        setArticles(helpArticles);
        setCategories(helpCategories);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedCategory = useMemo(() => {
    return (
      categories.find((c) => c.id === activeCategoryId) ||
      helpCategories.find((c) => c.id === activeCategoryId) ||
      helpCategories[0]
    );
  }, [categories, activeCategoryId]);

  // Filter articles belonging to this category and matching search
  const categoryArticles = useMemo(() => {
    const catArts = articles.filter((a) => a.categoryId === selectedCategory.id);
    if (!searchQuery.trim()) return catArts;

    const q = searchQuery.toLowerCase();
    return catArts.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q)
    );
  }, [articles, selectedCategory, searchQuery]);

  if (loading && !selectedCategory) {
    return (
      <div className="hc-category-loading">
        <HelpCenterNavbar />
        <Container>
          <div className="hc-cat-loading-box">
            <div className="hc-cat-spinner"></div>
            <h2>Loading Knowledge Track...</h2>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="hc-category-page">
      <HelpCenterNavbar />

      {/* Category Hero Banner */}
      <CategoryHero
        category={selectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        articleCount={categoryArticles.length}
      />

      {/* Category Track Switcher Bar */}
      <nav className="hc-cat-switcher-bar">
        <Container>
          <div className="hc-cat-switcher-inner">
            <span className="hc-cat-switcher-label">
              <FiLayers /> Tracks:
            </span>
            <div className="hc-cat-switcher-list">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon] || FiCheckCircle;
                const isActive = cat.id === selectedCategory.id;
                return (
                  <Link
                    key={cat.id}
                    to={`/help/category/${cat.id}`}
                    className={`hc-switcher-pill ${isActive ? "active" : ""}`}
                    style={isActive ? { "--active-color": cat.color || "#04B3C0" } : {}}
                  >
                    <Icon className="hc-switcher-icon" />
                    <span>{cat.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </nav>

      {/* Main Documentation Section */}
      <main className="hc-cat-docs-section">
        <Container>
          <div className="hc-cat-docs-header">
            <div>
              <h2 className="hc-cat-docs-title">
                {searchQuery ? `Search Results (${categoryArticles.length})` : "Documentation Guides"}
              </h2>
              <p className="hc-cat-docs-subtitle">
                Step-by-step instructions and technical references for {selectedCategory.title}.
              </p>
            </div>
          </div>

          {/* Article Grid */}
          <ArticleList
            articles={categoryArticles}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
          />
        </Container>
      </main>

      {/* Minimalist Contact Support */}
      <SupportBanner />

      <Footer />
    </div>
  );
};

export default CategoryPage;