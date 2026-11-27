import "./RelatedGuides.css";
import { Link } from "react-router-dom";
import { FiBookOpen, FiArrowRight } from "react-icons/fi";
import ArticleCard from "../../Hcomponents/ArticleCard";

const RelatedGuides = ({ articles = [], currentArticle }) => {

    if (!currentArticle) return null;

    const relatedArticles = articles
        .filter(
            article =>
                article.categoryId === currentArticle.categoryId &&
                article.id !== currentArticle.id
        )
        .slice(0, 3);

    if (relatedArticles.length === 0) return null;

    return (

        <section className="related-guides">

            <div className="related-guides-header">

                <div className="related-guides-title">

                    <span className="related-badge">

                        <FiBookOpen />

                        Continue Learning

                    </span>

                    <h2>
                        Explore More Guides
                    </h2>

                    <p>
                        Continue learning with more documentation from this category.
                    </p>

                </div>

                <Link
                    to={`/help/category/${currentArticle.categoryId}`}
                    className="view-all-btn"
                >

                    Browse Category

                    <FiArrowRight />

                </Link>

            </div>

            <div className="related-guides-grid">

                {relatedArticles.map(article => (

                    <ArticleCard
                        key={article.id}
                        article={article}
                    />

                ))}

            </div>

        </section>

    );

};

export default RelatedGuides;