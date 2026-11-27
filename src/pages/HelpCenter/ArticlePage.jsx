import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { marked } from "marked";
import { getArticles } from "../../Services/articleService";
import { getCategories } from "../../Services/categoryService";
import { helpArticles } from "./data/helpArticles";
import { helpCategories } from "./data/helpCategories";
import HelpCenterNavbar from "../../components/layout/HelpCenterNavbar/HelpCenterNavbar";
import Container from "../../components/common/Container/Container";
import RelatedGuides from "./Hsections/RelatedGuides/RelatedGuides";
import Footer from "../../components/layout/Footer/Footer";
import "./ArticlePage.css";
import {
  FiClock,
  FiCalendar,
  FiEye,
  FiThumbsUp,
  FiThumbsDown,
  FiArrowLeft,
  FiArrowRight,
  FiChevronRight,
  FiBookOpen,
  FiCheckCircle,
} from "react-icons/fi";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Preprocess markdown to convert GitHub-style alert callouts into structured HTML
 */
function preprocessMarkdown(content) {
  if (!content) return "";

  // Replace GitHub alerts: > [!TIP], > [!IMPORTANT], > [!NOTE], > [!WARNING]
  const calloutRegex = /^>\s*\[!(TIP|IMPORTANT|NOTE|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gim;

  const withCallouts = content.replace(calloutRegex, (match, type, body) => {
    const cleanBody = body.replace(/^>\s?/gm, "").trim();
    const typeUpper = type.toUpperCase();
    const typeClass = type.toLowerCase();

    let icon = "💡";
    if (typeUpper === "IMPORTANT") icon = "⚠️";
    if (typeUpper === "NOTE") icon = "ℹ️";
    if (typeUpper === "WARNING" || typeUpper === "CAUTION") icon = "🚨";

    return `\n\n<div class="hc-callout hc-callout-${typeClass}">
  <div class="hc-callout-header">
    <span class="hc-callout-icon">${icon}</span>
    <span class="hc-callout-tag">${typeUpper}</span>
  </div>
  <div class="hc-callout-body">${marked.parse(cleanBody)}</div>
</div>\n\n`;
  });

  return withCallouts;
}

/**
 * Extract Headings from markdown for Table of Contents
 */
function extractHeadings(content) {
  if (!content) return [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length; // 2 for h2, 3 for h3
    const rawText = match[2].trim();
    // Strip bold, inline code, and symbols
    const title = rawText.replace(/\*\*/g, "").replace(/`/g, "").replace(/—/g, "-");
    const id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    headings.push({ level, title, id });
  }

  return headings;
}

/**
 * Post-process HTML to attach IDs to h2 and h3 elements for anchor links
 */
function injectHeadingIds(html) {
  if (!html) return "";
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/gi, (match, tag, text) => {
    const plainText = text.replace(/<[^>]+>/g, "").replace(/—/g, "-").trim();
    const id = plainText
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    return `<${tag} id="${id}" class="hc-doc-heading">${text}</${tag}>`;
  });
}

const ArticlePage = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [userVote, setUserVote] = useState(null); // 'helpful' | 'not-helpful' | null
  const [scrollProgress, setScrollProgress] = useState(0);

  const { articleId } = useParams();

  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setUserVote(null);
  }, [articleId]);

  // Load articles and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [arts, cats] = await Promise.all([getArticles(), getCategories()]);
        setArticles(Array.isArray(arts) && arts.length > 0 ? arts : helpArticles);
        setCategories(Array.isArray(cats) && cats.length > 0 ? cats : helpCategories);
      } catch (err) {
        setArticles(helpArticles);
        setCategories(helpCategories);
      }
    }
    loadData();
  }, []);

  // Track Reading Progress Bar & Active Heading
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }

      // Check which heading is currently in view
      const headings = document.querySelectorAll(".hc-doc-heading");
      let currentActive = "";
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 140) {
          currentActive = heading.id;
        }
      });
      if (currentActive) {
        setActiveHeading(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedArticle = useMemo(() => {
    return articles.find((a) => a.id === articleId) || helpArticles.find((a) => a.id === articleId);
  }, [articles, articleId]);

  const category = useMemo(() => {
    if (!selectedArticle) return null;
    return categories.find((c) => c.id === selectedArticle.categoryId) || null;
  }, [categories, selectedArticle]);

  // Previous and Next articles in the same category
  const categoryArticles = useMemo(() => {
    if (!selectedArticle) return [];
    return articles.filter((a) => a.categoryId === selectedArticle.categoryId);
  }, [articles, selectedArticle]);

  const currentIndex = categoryArticles.findIndex((a) => a.id === articleId);
  const prevArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < categoryArticles.length - 1
      ? categoryArticles[currentIndex + 1]
      : null;

  // Extracted Table of Contents
  const headings = useMemo(() => {
    if (!selectedArticle?.content) return [];
    return extractHeadings(selectedArticle.content);
  }, [selectedArticle]);

  // Parse HTML
  const parsedHtml = useMemo(() => {
    if (!selectedArticle?.content) return "";
    const preprocessed = preprocessMarkdown(selectedArticle.content);
    const rawHtml = marked.parse(preprocessed);
    return injectHeadingIds(rawHtml);
  }, [selectedArticle]);

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveHeading(id);
    }
  };

  if (!selectedArticle) {
    return (
      <div className="hc-article-loading">
        <HelpCenterNavbar />
        <Container>
          <div className="hc-loading-box">
            <div className="hc-loading-spinner"></div>
            <h2>Loading Documentation Guide...</h2>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="hc-article-page">
      {/* Scroll Progress Bar */}
      <div
        className="hc-reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      <HelpCenterNavbar />

      {/* Breadcrumb Header Bar */}
      <div className="hc-breadcrumb-bar">
        <Container>
          <div className="hc-breadcrumb-inner">
            <nav className="hc-breadcrumbs">
              <Link to="/help" className="hc-bc-link">
                Help Center
              </Link>
              <FiChevronRight className="hc-bc-sep" />
              {category ? (
                <Link to={`/help/category/${category.id}`} className="hc-bc-link">
                  {category.title}
                </Link>
              ) : (
                <span className="hc-bc-link">Documentation</span>
              )}
              <FiChevronRight className="hc-bc-sep" />
              <span className="hc-bc-current">{selectedArticle.title}</span>
            </nav>

            <Link
              to={category ? `/help/category/${category.id}` : "/help"}
              className="hc-back-btn"
            >
              <FiArrowLeft />
              <span>Back to {category ? category.title : "Documentation"}</span>
            </Link>
          </div>
        </Container>
      </div>

      <main className="hc-article-main">
        <Container>
          <div className="hc-article-layout">
            {/* Main Content Column */}
            <article className="hc-article-body-col">
              {/* Article Header */}
              <header className="hc-doc-header">
                <div className="hc-doc-top-meta">
                  {category && (
                    <span
                      className="hc-doc-category-badge"
                      style={{
                        color: category.color || "#04b3c0",
                        backgroundColor: `${category.color || "#04b3c0"}15`,
                        borderColor: `${category.color || "#04b3c0"}35`,
                      }}
                    >
                      <span
                        className="hc-doc-cat-dot"
                        style={{ backgroundColor: category.color || "#04b3c0" }}
                      ></span>
                      {category.title}
                    </span>
                  )}
                  {selectedArticle.readTime && (
                    <span className="hc-doc-meta-item">
                      <FiClock className="hc-doc-meta-icon" />
                      {selectedArticle.readTime}
                    </span>
                  )}
                  {selectedArticle.updatedAt && (
                    <span className="hc-doc-meta-item">
                      <FiCalendar className="hc-doc-meta-icon" />
                      Updated {selectedArticle.updatedAt}
                    </span>
                  )}
                  {selectedArticle.views && (
                    <span className="hc-doc-meta-item">
                      <FiEye className="hc-doc-meta-icon" />
                      {selectedArticle.views.toLocaleString()} views
                    </span>
                  )}
                </div>

                <h1 className="hc-doc-main-title">{selectedArticle.title}</h1>

                {selectedArticle.summary && (
                  <p className="hc-doc-lead-summary">{selectedArticle.summary}</p>
                )}

                {/* Contained Article Hero Image */}
                {selectedArticle.image && (
                  <div className="hc-doc-image-container">
                    <img
                      src={selectedArticle.image}
                      alt={selectedArticle.title}
                      className="hc-doc-hero-img"
                    />
                  </div>
                )}
              </header>

              {/* Rendered Markdown Body */}
              <div
                className="hc-doc-content"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />

              {/* Was this helpful feedback block */}
              <div className="hc-feedback-block">
                <div className="hc-feedback-inner">
                  {userVote ? (
                    <div className="hc-feedback-thankyou">
                      <FiCheckCircle className="hc-feedback-check-icon" />
                      <div>
                        <h4>Thank you for your feedback!</h4>
                        <p>It helps us continually improve our documentation and operational playbooks.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="hc-feedback-text">
                        <h4>Was this article helpful?</h4>
                        <p>Let us know if this documentation answered your question.</p>
                      </div>
                      <div className="hc-feedback-actions">
                        <button
                          type="button"
                          className="hc-feedback-btn yes"
                          onClick={() => setUserVote("helpful")}
                        >
                          <FiThumbsUp />
                          <span>Yes</span>
                        </button>
                        <button
                          type="button"
                          className="hc-feedback-btn no"
                          onClick={() => setUserVote("not-helpful")}
                        >
                          <FiThumbsDown />
                          <span>No</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Prev / Next Pagination */}
              <nav className="hc-article-nav">
                {prevArticle ? (
                  <Link
                    to={`/help/article/${prevArticle.id}`}
                    className="hc-nav-card prev"
                  >
                    <span className="hc-nav-direction">
                      <FiArrowLeft /> Previous Guide
                    </span>
                    <span className="hc-nav-title">{prevArticle.title}</span>
                  </Link>
                ) : (
                  <div className="hc-nav-placeholder"></div>
                )}

                {nextArticle ? (
                  <Link
                    to={`/help/article/${nextArticle.id}`}
                    className="hc-nav-card next"
                  >
                    <span className="hc-nav-direction">
                      Next Guide <FiArrowRight />
                    </span>
                    <span className="hc-nav-title">{nextArticle.title}</span>
                  </Link>
                ) : (
                  <div className="hc-nav-placeholder"></div>
                )}
              </nav>
            </article>

            {/* Right Sticky Sidebar (Table of Contents & Quick Actions) */}
            <aside className="hc-article-sidebar-col">
              <div className="hc-sticky-sidebar">
                {/* Table of Contents */}
                {headings.length > 0 && (
                  <div className="hc-toc-widget">
                    <div className="hc-toc-header">
                      <FiBookOpen className="hc-toc-icon" />
                      <span>On this page</span>
                    </div>
                    <ul className="hc-toc-list">
                      {headings.map((heading) => (
                        <li
                          key={heading.id}
                          className={`hc-toc-item level-${heading.level} ${
                            activeHeading === heading.id ? "active" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="hc-toc-link-btn"
                            onClick={() => scrollToHeading(heading.id)}
                          >
                            {heading.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Direct Support Card */}
                <div className="hc-support-mini-card">
                  <h4>Need assistance?</h4>
                  <p>Our India operations team is available to help configure this.</p>
                  <a
                    href="mailto:support@stayops.in"
                    className="hc-support-mini-link"
                  >
                    <span>Contact Support →</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>

          {/* Related Guides Component */}
          <RelatedGuides articles={articles} currentArticle={selectedArticle} />
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePage;