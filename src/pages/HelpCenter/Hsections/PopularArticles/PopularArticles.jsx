import React, { useEffect, useState } from "react";
import "./PopularArticles.css";
import Container from "../../../../components/common/Container/Container";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiClock, FiThumbsUp, FiArrowRight, FiEye } from "react-icons/fi";
import { getArticles } from "../../../../Services/articleService";
import { helpArticles } from "../../data/helpArticles";

function PopularArticles() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function loadPopular() {
      try {
        const data = await getArticles();
        if (Array.isArray(data) && data.length > 0) {
          // Sort by views descending and take top 4
          const sorted = [...data].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
          setArticles(sorted);
        } else {
          const sorted = [...helpArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
          setArticles(sorted);
        }
      } catch (err) {
        const sorted = [...helpArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
        setArticles(sorted);
      }
    }
    loadPopular();
  }, []);

  return (
    <section className="hc-popular-section">
      <Container>
        <div className="hc-popular-header">
          <div>
            <div className="hc-popular-tag">
              <FiTrendingUp className="hc-popular-tag-icon" />
              <span>Trending Reads</span>
            </div>
            <h2 className="hc-popular-title">Frequently Consulted Guides</h2>
            <p className="hc-popular-desc">
              Articles and step-by-step playbooks most frequently read by property managers and homestay hosts.
            </p>
          </div>
          <Link to="/help/category/getting-started" className="hc-popular-viewall">
            <span>View All Guides</span>
            <FiArrowRight />
          </Link>
        </div>

        <div className="hc-popular-cards-grid">
          {articles.map((art) => (
            <Link
              key={art.id}
              to={`/help/article/${art.id}`}
              className="hc-popular-card"
            >
              {art.image && (
                <div className="hc-popular-thumb-wrap">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="hc-popular-thumb"
                    loading="lazy"
                  />
                  <div className="hc-popular-thumb-overlay"></div>
                  <span className="hc-popular-cat-chip">
                    {art.categoryId?.replace("-", " ")}
                  </span>
                </div>
              )}

              <div className="hc-popular-card-body">
                <h3 className="hc-popular-card-title">{art.title}</h3>
                <p className="hc-popular-card-summary">{art.summary}</p>

                <div className="hc-popular-meta">
                  <div className="hc-popular-meta-left">
                    {art.readTime && (
                      <span className="hc-meta-item">
                        <FiClock className="hc-meta-icon" />
                        {art.readTime}
                      </span>
                    )}
                    {art.views && (
                      <span className="hc-meta-item">
                        <FiEye className="hc-meta-icon" />
                        {art.views.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="hc-popular-read-link">
                    <span>Read</span>
                    <FiArrowRight className="hc-popular-read-arrow" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default PopularArticles;