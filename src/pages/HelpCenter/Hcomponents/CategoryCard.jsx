import "./CategoryCard.css";
import iconMap from "../data/iconMap";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";

function CategoryCard({
  id,
  title,
  description,
  articleCount,
  icon,
  color = "#04B3C0",
  popular = false,
}) {
  const Icon = iconMap[icon] || FiCheckCircle;

  return (
    <Link
      to={`/help/category/${id}`}
      className="hc-category-link"
      style={{ "--cat-color": color }}
    >
      <div className="hc-category-card">
        <div className="hc-category-card-glow"></div>

        <div className="hc-category-top">
          <div
            className="hc-category-icon"
            style={{
              color: color,
              backgroundColor: `${color}15`,
              borderColor: `${color}30`,
            }}
          >
            <Icon />
          </div>

          {popular && <span className="hc-category-popular-badge">Popular</span>}
        </div>

        <h3 className="hc-category-title">{title}</h3>

        <p className="hc-category-description">{description}</p>

        <div className="hc-cardfooter">
          <div className="hc-category-footer">
            <span className="hc-count-dot" style={{ backgroundColor: color }}></span>
            <span>{articleCount} {articleCount === 1 ? "Article" : "Articles"}</span>
          </div>
          <div className="hc-category-action">
            <span>Browse Track</span>
            <FiArrowRight className="hc-arrow" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CategoryCard;