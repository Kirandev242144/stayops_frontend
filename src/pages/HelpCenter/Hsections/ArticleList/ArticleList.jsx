import React from "react";
import ArticleCard from "../../Hcomponents/ArticleCard";
import "./ArticleList.css";
import { FiInbox } from "react-icons/fi";

const ArticleList = ({ articles = [], searchQuery = "", onClearSearch }) => {
  if (articles.length === 0) {
    return (
      <div className="hc-article-list-empty">
        <div className="hc-empty-icon-wrap">
          <FiInbox className="hc-empty-icon" />
        </div>
        <h3>No matching guides found</h3>
        <p>
          {searchQuery
            ? `We couldn't find any articles matching "${searchQuery}" in this category.`
            : "No articles are available in this category yet."}
        </p>
        {searchQuery && onClearSearch && (
          <button
            type="button"
            className="hc-empty-clear-btn"
            onClick={onClearSearch}
          >
            Clear Search Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="hc-article-grid">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default ArticleList;