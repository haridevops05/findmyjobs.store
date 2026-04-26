import { useEffect, useState, useMemo, useCallback } from "react";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("jobFavorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [locationFilter, setLocationFilter] = useState("");
  const jobsPerPage = 10;

  const KEYWORDS = [
    "devops",
    "aws",
    "kubernetes",
    "senior devops",
    "finops",
    "cloud",
    "sre",
    "terraform",
    "docker",
    "ci/cd",
    "azure",
    "gcp",
    "jenkins",
    "ansible",
    "prometheus",
    "grafana",
    "linux",
    "python",
    "automation"
  ];

  const isRelevant = useCallback(
    (title) => {
      if (selectedKeywords.length === 0) {
        return KEYWORDS.some((k) => title.toLowerCase().includes(k));
      }
      return selectedKeywords.some((k) => title.toLowerCase().includes(k));
    },
    [selectedKeywords]
  );

  const toggleFavorite = useCallback(
    (job) => {
      setFavorites((prev) => {
        const exists = prev.find((f) => f.url === job.url);
        if (exists) {
          return prev.filter((f) => f.url !== job.url);
        }
        return [...prev, { ...job, favoritedAt: new Date().toISOString() }];
      });
    },
    []
  );

  useEffect(() => {
    localStorage.setItem("jobFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [res1, res2] = await Promise.allSettled([
        fetch("https://remotive.com/api/remote-jobs?category=devops"),
        fetch("https://www.arbeitnow.com/api/job-board-api?search=devops"),
      ]);

      let combined = [];

      if (res1.status === "fulfilled") {
        const data1 = await res1.value.json();
        const remotiveJobs = data1.jobs
          .filter((j) => isRelevant(j.title))
          .map((j) => ({
            id: `remotive-${j.id}`,
            title: j.title,
            company: j.company_name,
            url: j.url,
            location: j.candidate_required_location || "Remote",
            type: j.job_type || "Full-time",
            salary: j.salary || "Not specified",
            source: "Remotive",
            postedAt: j.publication_date,
            tags: extractTags(j.title, j.description || ""),
          }));
        combined = [...combined, ...remotiveJobs];
      }

      if (res2.status === "fulfilled") {
        const data2 = await res2.value.json();
        const arbeitJobs = data2.data
          .filter((j) => isRelevant(j.title))
          .map((j) => ({
            id: `arbeitnow-${j.slug}`,
            title: j.title,
            company: j.company_name,
            url: j.url,
            location: j.location || "Remote",
            type: j.job_type || "Full-time",
            salary: "Not specified",
            source: "Arbeitnow",
            postedAt: j.created_at,
            tags: extractTags(j.title, j.description || ""),
          }));
        combined = [...combined, ...arbeitJobs];
      }

      if (res1.status === "rejected" && res2.status === "rejected") {
        throw new Error("Failed to fetch jobs from all sources");
      }

      setJobs(combined);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isRelevant]);

  useEffect(() => {
    fetchJobs();
    // Refresh every 5 minutes
    const interval = setInterval(fetchJobs, 300000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const extractTags = (title, description) => {
    const text = `${title} ${description}`.toLowerCase();
    return KEYWORDS.filter((k) => text.includes(k)).slice(0, 5);
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.tags.some((tag) => tag.includes(searchTerm.toLowerCase()))
      );
    }

    // Location filter
    if (locationFilter) {
      result = result.filter((job) =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Sorting
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case "company":
        result.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Relevance - prioritize jobs with more keyword matches
        result.sort(
          (a, b) =>
            b.tags.length - a.tags.length ||
            new Date(b.postedAt) - new Date(a.postedAt)
        );
    }

    // Remove duplicates
    const seen = new Set();
    result = result.filter((job) => {
      const duplicate = seen.has(job.url);
      seen.add(job.url);
      return !duplicate;
    });

    return result;
  }, [jobs, searchTerm, locationFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / jobsPerPage);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  const theme = {
    background: darkMode ? "#020617" : "#f8fafc",
    color: darkMode ? "#f8fafc" : "#0f172a",
    card: darkMode ? "#0f172a" : "#ffffff",
    cardBorder: darkMode ? "#1e293b" : "#e2e8f0",
    input: darkMode ? "#1e293b" : "#f1f5f9",
    inputColor: darkMode ? "#f8fafc" : "#0f172a",
    tag: darkMode ? "#312e81" : "#e0e7ff",
    tagColor: darkMode ? "#c7d2fe" : "#3730a3",
    muted: darkMode ? "#94a3b8" : "#64748b",
  };

  const stats = {
    total: jobs.length,
    filtered: filteredAndSortedJobs.length,
    favorites: favorites.length,
    remote: jobs.filter((j) => j.location.toLowerCase().includes("remote")).length,
  };

  return (
    <div
      style={{
        padding: "20px",
        background: theme.background,
        minHeight: "100vh",
        color: theme.color,
        transition: "all 0.3s",
      }}
    >
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🚀 Mercury Round AI - DevOps Jobs</h1>
          <p style={{ color: theme.muted }}>
            Real-time job aggregation from multiple sources
          </p>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            ...styles.iconButton,
            background: theme.card,
            color: theme.color,
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <StatBadge label="Total Jobs" value={stats.total} color="#6366f1" />
        <StatBadge label="Showing" value={stats.filtered} color="#22c55e" />
        <StatBadge label="Favorites" value={stats.favorites} color="#f59e0b" />
        <StatBadge label="Remote" value={stats.remote} color="#06b6d4" />
      </div>

      {/* Search & Filters */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="🔍 Search by title, company, or skill..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            ...styles.input,
            background: theme.input,
            color: theme.inputColor,
            border: `1px solid ${theme.cardBorder}`,
          }}
        />

        <input
          type="text"
          placeholder="📍 Filter by location..."
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            ...styles.input,
            background: theme.input,
            color: theme.inputColor,
            border: `1px solid ${theme.cardBorder}`,
          }}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            ...styles.select,
            background: theme.input,
            color: theme.inputColor,
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          <option value="relevance">📊 Sort: Relevance</option>
          <option value="recent">🕒 Sort: Most Recent</option>
          <option value="company">🏢 Sort: Company</option>
          <option value="title">📝 Sort: Title</option>
        </select>

        <button
          onClick={() => {
            fetchJobs();
            setCurrentPage(1);
          }}
          style={styles.refreshButton}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Keyword Filters */}
      <div style={styles.keywordsContainer}>
        <span style={{ marginRight: "10px", color: theme.muted }}>Filter by:</span>
        {KEYWORDS.map((keyword) => (
          <button
            key={keyword}
            onClick={() =>
              setSelectedKeywords((prev) =>
                prev.includes(keyword)
                  ? prev.filter((k) => k !== keyword)
                  : [...prev, keyword]
              )
            }
            style={{
              ...styles.keyword,
              background: selectedKeywords.includes(keyword)
                ? "#6366f1"
                : theme.tag,
              color: selectedKeywords.includes(keyword)
                ? "#fff"
                : theme.tagColor,
            }}
          >
            {keyword}
            {selectedKeywords.includes(keyword) && " ✓"}
          </button>
        ))}
        {selectedKeywords.length > 0 && (
          <button
            onClick={() => setSelectedKeywords([])}
            style={{ ...styles.keyword, background: "#ef4444", color: "#fff" }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div style={styles.favoritesSection}>
          <h3 style={{ color: "#f59e0b" }}>⭐ Favorite Jobs ({favorites.length})</h3>
          <div style={styles.favoritesList}>
            {favorites.slice(0, 5).map((job) => (
              <a
                key={job.url}
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.color, textDecoration: "none" }}
              >
                <div style={{ ...styles.card, background: theme.card, padding: "10px" }}>
                  <strong>{job.title}</strong>
                  <span style={{ color: theme.muted }}> - {job.company}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
          <button onClick={fetchJobs} style={{ marginLeft: "10px" }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Fetching latest DevOps jobs...</p>
        </div>
      )}

      {/* Job Listings */}
      {!loading && !error && (
        <>
          {paginatedJobs.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No jobs found matching your criteria</p>
              <button onClick={() => {
                setSearchTerm("");
                setLocationFilter("");
                setSelectedKeywords([]);
              }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <p style={{ color: theme.muted }}>
                Showing {paginatedJobs.length} of {filteredAndSortedJobs.length} jobs
                {filteredAndSortedJobs.length !== jobs.length &&
                  ` (filtered from ${jobs.length})`}
              </p>

              {paginatedJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    ...styles.card,
                    background: theme.card,
                    border: `1px solid ${theme.cardBorder}`,
                  }}
                >
                  <div style={styles.jobHeader}>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0" }}>{job.title}</h3>
                      <p style={{ margin: 0, color: theme.muted }}>
                        {job.company} • {job.location} • {job.type}
                      </p>
                    </div>
                    <div style={styles.jobActions}>
                      <span style={styles.sourceBadge}>{job.source}</span>
                      <button
                        onClick={() => toggleFavorite(job)}
                        style={{
                          ...styles.iconButton,
                          background: "transparent",
                          fontSize: "20px",
                        }}
                        title={favorites.find((f) => f.url === job.url) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {favorites.find((f) => f.url === job.url) ? "⭐" : "☆"}
                      </button>
                    </div>
                  </div>

                  <div style={styles.tags}>
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          ...styles.tag,
                          background: theme.tag,
                          color: theme.tagColor,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={styles.jobFooter}>
                    <span style={{ color: theme.muted }}>
                      💰 {job.salary} • 📅 {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <button style={styles.applyButton}>Apply Now →</button>
                    </a>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={styles.pageButton}
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        ...styles.pageButton,
                        background:
                          currentPage === i + 1 ? "#6366f1" : theme.card,
                        color: theme.color,
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={styles.pageButton}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

const StatBadge = ({ label, value, color }) => (
  <div
    style={{
      background: `${color}20`,
      padding: "10px 15px",
      borderRadius: "8px",
      borderLeft: `3px solid ${color}`,
    }}
  >
    <div style={{ fontSize: "12px", opacity: 0.7 }}>{label}</div>
    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{value}</div>
  </div>
);

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "2rem",
    margin: 0,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px",
    marginBottom: "15px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
  },
  refreshButton: {
    padding: "12px 20px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "transform 0.2s",
    ":hover": { transform: "scale(1.05)" },
  },
  keywordsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    alignItems: "center",
  },
  keyword: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  card: {
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "15px",
    transition: "transform 0.2s",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sourceBadge: {
    padding: "4px 10px",
    background: "#6366f120",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#6366f1",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    margin: "10px 0",
  },
  tag: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
  },
  jobFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },
  applyButton: {
    padding: "8px 20px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  iconButton: {
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #6366f120",
    borderTop: "4px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
  error: {
    padding: "15px",
    background: "#ef444420",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    color: "#ef4444",
    marginBottom: "15px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  favoritesSection: {
    marginBottom: "20px",
    padding: "15px",
    background: "rgba(245, 158, 11, 0.1)",
    borderRadius: "12px",
  },
  favoritesList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "10px",
    marginTop: "10px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "20px",
    marginBottom: "40px",
  },
  pageButton: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
};

// Add spinner animation
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);