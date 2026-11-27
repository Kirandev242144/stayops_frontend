import CategoryCard from "../../Hcomponents/CategoryCard";
import Container from "../../../../components/common/Container/Container";
import { useEffect, useState, useMemo } from "react";
import { getCategories } from "../../../../Services/categoryService";
import { helpCategories } from "../../data/helpCategories";
import "./Categories.css";
import { FiLayers, FiCheckCircle } from "react-icons/fi";

const FILTERS = [
  { id: "all", label: "All Categories" },
  { id: "popular", label: "🔥 Most Popular" },
  { id: "operations", label: "Operations & Ground" },
  { id: "channels", label: "OTA & Direct Booking" },
  { id: "admin", label: "PMS & Security" },
];

function Categories() {
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(helpCategories);
        }
      } catch (error) {
        console.warn("Falling back to local helpCategories:", error);
        setCategories(helpCategories);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (activeFilter === "popular") {
      return categories.filter((c) => c.popular);
    }
    if (activeFilter === "operations") {
      return categories.filter((c) =>
        ["getting-started", "caretaker-ops"].includes(c.id)
      );
    }
    if (activeFilter === "channels") {
      return categories.filter((c) =>
        ["channel-manager", "whatsapp-storefront", "direct-storefront"].includes(c.id)
      );
    }
    if (activeFilter === "admin") {
      return categories.filter((c) =>
        ["owner-dashboard", "billing-subscriptions", "security-rbac"].includes(c.id)
      );
    }
    return categories;
  }, [categories, activeFilter]);

  return (
    <section className="hc-categories" id="hc-categories-section">
      <Container>
        <div className="hc-categories-header-wrap">
          <div>
            <div className="hc-categories-badge">
              <FiLayers className="hc-categories-badge-icon" />
              <span>Full Knowledge Tracks</span>
            </div>
            <h2 className="hc-categories-title">Explore by Knowledge Track</h2>
            <p className="hc-categories-description">
              Comprehensive operational playbooks organized by department, workflow, and feature set.
            </p>
          </div>

          <div className="hc-categories-count-badge">
            <span className="hc-count-num">{categories.length}</span>
            <span className="hc-count-txt">Tracks Available</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="hc-categories-filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`hc-filter-pill ${activeFilter === filter.id ? "active" : ""}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="hc-categories-grid">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              title={category.title}
              description={category.description}
              articleCount={category.articleCount}
              icon={category.icon}
              color={category.color}
              popular={category.popular}
              image={category.image}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Categories;