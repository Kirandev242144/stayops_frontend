import "./ArticleCard.css";
import { Link } from "react-router-dom";
import { FiThumbsUp, FiArrowRight, FiClock } from "react-icons/fi";

const ArticleCard = ({ article }) => {
  if (!article) return null;

  return (
    <Link to={`/help/article/${article.id}`} className="hc-related-card-link">
      <div className="hc-related-card">
        {article.image && (
          <div className="hc-related-image-wrap">
            <img src={article.image} alt={article.title} loading="lazy" />
            <div className="hc-related-image-overlay"></div>
            {article.readTime && (
              <span className="hc-related-read-pill">
                <FiClock /> {article.readTime}
              </span>
            )}
          </div>
        )}

        <div className="hc-related-card-body">
          <span className="hc-related-category">
            {article.categoryId?.replace("-", " ")}
          </span>
          <h3 className="hc-related-card-title">{article.title}</h3>
          <p className="hc-related-card-summary">{article.summary}</p>

          <div className="hc-related-card-footer">
            <span className="hc-related-helpful">
              <FiThumbsUp />
              <span>{article.helpfulCount || 0} found helpful</span>
            </span>
            <span className="hc-related-read-action">
              <span>Read</span>
              <FiArrowRight className="hc-related-arrow" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;