import React, { useState, useMemo } from "react";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./AdminTable.css";

/**
 * Senior-level reusable data table component for the StayOps Admin Console.
 * Supports built-in client-side text search, tab-based category filtering,
 * clean responsive table rendering, and pagination.
 *
 * @param {Array<Object>} columns - [{ key, label, render?, width? }]
 * @param {Array<Object>} data - Raw data rows
 * @param {Array<string>} searchKeys - Keys to search across when user types in search input
 * @param {Array<Object>} filterTabs - [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active', filterFn }]
 * @param {string} searchPlaceholder - Placeholder for the search input
 * @param {number} pageSize - Number of items per page (default: 8)
 * @param {React.ReactNode} actionsRight - Optional toolbar actions (e.g. Export, Add)
 */
const AdminTable = ({
  columns = [],
  data = [],
  searchKeys = [],
  filterTabs = [],
  searchPlaceholder = "Search records...",
  pageSize = 8,
  actionsRight = null,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(
    filterTabs.length > 0 ? filterTabs[0].id : "all"
  );
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filter by active tab
  const tabFilteredData = useMemo(() => {
    if (!filterTabs || filterTabs.length === 0 || activeTab === "all") {
      return data;
    }
    const currentTabObj = filterTabs.find((t) => t.id === activeTab);
    if (!currentTabObj || !currentTabObj.filterFn) {
      return data;
    }
    return data.filter(currentTabObj.filterFn);
  }, [data, activeTab, filterTabs]);

  // 2. Filter by search query
  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim() || searchKeys.length === 0) {
      return tabFilteredData;
    }
    const query = searchQuery.toLowerCase().trim();
    return tabFilteredData.filter((row) =>
      searchKeys.some((key) => {
        const val = row[key];
        return val ? String(val).toLowerCase().includes(query) : false;
      })
    );
  }, [tabFilteredData, searchQuery, searchKeys]);

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(searchFilteredData.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return searchFilteredData.slice(startIndex, startIndex + pageSize);
  }, [searchFilteredData, validCurrentPage, pageSize]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const startEntryIndex =
    searchFilteredData.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endEntryIndex = Math.min(
    validCurrentPage * pageSize,
    searchFilteredData.length
  );

  return (
    <div className="admin-table-container">
      {/* Table Toolbar */}
      <div className="admin-table-toolbar">
        {/* Left: Filter Tabs */}
        {filterTabs.length > 0 && (
          <div className="admin-table-tabs" role="tablist">
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              // Compute count for tab if filterFn provided
              let count = data.length;
              if (tab.id !== "all" && tab.filterFn) {
                count = data.filter(tab.filterFn).length;
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`admin-table-tab ${isActive ? "is-active" : ""}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="admin-table-tab__count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Search Input + Actions */}
        <div className="admin-table-toolbar-right">
          <div className="admin-table-search">
            <FiSearch className="admin-table-search__icon" size={15} />
            <input
              type="text"
              className="admin-table-search__input"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              aria-label="Filter table records"
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-table-search__clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {actionsRight && (
            <div className="admin-table-custom-actions">{actionsRight}</div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`admin-table__th ${col.align ? `align-${col.align}` : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="admin-table__empty">
                  <div className="admin-table-empty-state">
                    <p className="admin-table-empty-state__title">
                      No records found
                    </p>
                    <p className="admin-table-empty-state__subtitle">
                      {searchQuery
                        ? `No results matching "${searchQuery}". Try a different keyword.`
                        : "There are currently no records in this view."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="admin-table__tr">
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(row[col.key], row, rowIndex)
                      : row[col.key];

                    return (
                      <td
                        key={col.key}
                        className={`admin-table__td ${
                          col.align ? `align-${col.align}` : ""
                        }`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="admin-table-footer">
        <div className="admin-table-footer__info">
          Showing{" "}
          <span className="font-semibold">{startEntryIndex}</span> to{" "}
          <span className="font-semibold">{endEntryIndex}</span> of{" "}
          <span className="font-semibold">{searchFilteredData.length}</span>{" "}
          entries
        </div>

        {totalPages > 1 && (
          <div className="admin-table-pagination">
            <button
              type="button"
              className="admin-table-pagination__btn"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span className="admin-table-pagination__counter">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="admin-table-pagination__btn"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <span>Next</span>
              <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTable;
