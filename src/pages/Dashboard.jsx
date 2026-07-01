import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/auth";
import AuthHeader from "../component/AuthHeader.jsx";

const PAGE_SIZE_OPTIONS = [5, 10, 20];


function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleString();
}

function toDateOnly(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [expanded, setExpanded]       = useState(null);

  // Filters
  const [filterName, setFilterName]   = useState("");
  const [filterFrom, setFilterFrom]   = useState("");
  const [filterTo, setFilterTo]       = useState("");

  // Pagination
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  // Sorting
  const [sortBy, setSortBy]           = useState("timestamp");
  const [sortOrder, setSortOrder]     = useState("desc");

  useEffect(() => {
    authFetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSubmissions(data.submissions || []);
        } else {
          setError(data.error || "Failed to load data.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not reach Google Sheets. Check your network or script URL.");
        setLoading(false);
      });
  }, []);

  // Reset to page 1 when filters or sort changes
  useEffect(() => { setPage(1); setExpanded(null); }, [filterName, filterFrom, filterTo, pageSize, sortBy, sortOrder]);

  const filtered = useMemo(() => {
    return submissions.filter((sub) => {
      if (filterName && !sub.respondent.toLowerCase().includes(filterName.toLowerCase())) return false;
      const dateOnly = toDateOnly(sub.timestamp);
      if (filterFrom && dateOnly < filterFrom) return false;
      if (filterTo   && dateOnly > filterTo)   return false;
      return true;
    });
  }, [submissions, filterName, filterFrom, filterTo]);

  const sorted = useMemo(() => {
    const data = [...filtered];

    data.sort((a, b) => {
      let av;
      let bv;

      if (sortBy === "respondent") {
        av = String(a.respondent || "").toLowerCase();
        bv = String(b.respondent || "").toLowerCase();
      } else if (sortBy === "timestamp") {
        av = new Date(a.timestamp || 0).getTime();
        bv = new Date(b.timestamp || 0).getTime();
      } else if (sortBy === "totalScore") {
        av = Number(a.totalScore || 0);
        bv = Number(b.totalScore || 0);
      } else {
        av = Number(a.totalWeightedScore || 0);
        bv = Number(b.totalWeightedScore || 0);
      }

      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [filtered, sortBy, sortOrder]);

  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated   = sorted.slice((page - 1) * pageSize, page * pageSize);

  const clearFilters = () => {
    setFilterName(""); setFilterFrom(""); setFilterTo("");
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder(column === "respondent" ? "asc" : "desc");
  };

  const sortIndicator = (column) => {
    if (sortBy !== column) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const toggleExpand = (idx) => setExpanded((prev) => (prev === idx ? null : idx));

  return (
    <main style={s.page}>
      <div style={s.shell}>
        {/* <div style={s.pageHeader}>
          <AuthHeader />
        </div> */}
        {/* ── Header ── */}
        <header style={s.header}>
          {/* <button style={s.backBtn} onClick={() => navigate("/")}>← Back</button> */}
          <AuthHeader />
          
          <h1 style={s.title}>Submissions Dashboard</h1>
          <p style={s.subtitle}>All responses saved to Google Sheets</p>

        </header>

        {/* ── Filter bar ── */}
        <div style={s.filterBar}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Respondent</label>
            <input
              style={s.filterInput}
              placeholder="Search name…"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>From date</label>
            <input
              type="date"
              style={s.filterInput}
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>To date</label>
            <input
              type="date"
              style={s.filterInput}
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Rows / page</label>
            <select
              style={s.filterInput}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <button style={s.clearBtn} onClick={clearFilters}>Clear</button>
        </div>

        {/* ── Body ── */}
        <div style={s.body}>
          {loading && <p style={s.info}>Loading submissions…</p>}
          {!loading && error && <p style={s.errMsg}>{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p style={s.info}>No submissions match your filters.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              {/* Summary chips */}
              <div style={s.summaryRow}>
                <span style={s.chip}>Total: <strong>{sorted.length}</strong></span>
                <span style={s.chip}>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
              </div>

              {/* Table */}
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>S.No</th>
                      <th style={s.th}>
                        <button style={s.sortBtn} onClick={() => handleSort("respondent")}>
                          Respondent {sortIndicator("respondent")}
                        </button>
                      </th>
                      <th style={s.th}>
                        <button style={s.sortBtn} onClick={() => handleSort("timestamp")}>
                          Submitted At {sortIndicator("timestamp")}
                        </button>
                      </th>
                      <th style={s.th}>
                        <button style={s.sortBtn} onClick={() => handleSort("totalScore")}>
                          Total Score {sortIndicator("totalScore")}
                        </button>
                      </th>
                      <th style={s.th}>
                        <button style={s.sortBtn} onClick={() => handleSort("totalWeightedScore")}>
                          Weighted Score {sortIndicator("totalWeightedScore")}
                        </button>
                      </th>
                      <th style={s.th}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((sub, i) => {
                      const globalIdx = (page - 1) * pageSize + i;
                      const isOpen    = expanded === globalIdx;
                      return (
                        <>
                          <tr key={globalIdx} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                            <td style={s.td}>{globalIdx + 1}</td>
                            <td style={{ ...s.td, fontWeight: 600 }}>{sub.respondent || "—"}</td>
                            <td style={s.td}>{formatDate(sub.timestamp)}</td>
                            <td style={{ ...s.td, ...s.scoreCell }}>{sub.totalScore}</td>
                            <td style={{ ...s.td, ...s.weightCell }}>{sub.totalWeightedScore}</td>
                            <td style={s.td}>
                              <button style={s.expandBtn} onClick={() => toggleExpand(globalIdx)}>
                                {isOpen ? "Hide ▲" : "View ▼"}
                              </button>
                            </td>
                          </tr>

                          {isOpen && (
                            <tr key={`d-${globalIdx}`}>
                              <td colSpan={6} style={s.detailCell}>
                                <table style={s.innerTable}>
                                  <thead>
                                    <tr>
                                      {["Q#", "Question", "Answer", "Score", "Weight"].map((h) => (
                                        <th key={h} style={s.ith}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(sub.questions || []).map((q, qi) => (
                                      <tr key={qi} style={qi % 2 === 0 ? s.irowEven : s.irowOdd}>
                                        <td style={s.itd}>{q.number}</td>
                                        <td style={{ ...s.itd, maxWidth: 380, lineHeight: 1.4 }}>{q.question}</td>
                                        <td style={s.itd}>{q.answer || "—"}</td>
                                        <td style={{ ...s.itd, textAlign: "center" }}>{q.score}</td>
                                        <td style={{ ...s.itd, textAlign: "center" }}>{q.weight}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <div style={s.pagination}>
                <button
                  style={{ ...s.pageBtn, ...(page === 1 ? s.pageBtnDis : {}) }}
                  disabled={page === 1}
                  onClick={() => { setPage(1); setExpanded(null); }}
                >«</button>
                <button
                  style={{ ...s.pageBtn, ...(page === 1 ? s.pageBtnDis : {}) }}
                  disabled={page === 1}
                  onClick={() => { setPage((p) => p - 1); setExpanded(null); }}
                >‹ Prev</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "…" ? (
                      <span key={`e${i}`} style={s.ellipsis}>…</span>
                    ) : (
                      <button
                        key={item}
                        style={{ ...s.pageBtn, ...(item === page ? s.pageBtnActive : {}) }}
                        onClick={() => { setPage(item); setExpanded(null); }}
                      >{item}</button>
                    )
                  )}

                <button
                  style={{ ...s.pageBtn, ...(page === totalPages ? s.pageBtnDis : {}) }}
                  disabled={page === totalPages}
                  onClick={() => { setPage((p) => p + 1); setExpanded(null); }}
                >Next ›</button>
                <button
                  style={{ ...s.pageBtn, ...(page === totalPages ? s.pageBtnDis : {}) }}
                  disabled={page === totalPages}
                  onClick={() => { setPage(totalPages); setExpanded(null); }}
                >»</button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const s = {
  /* ── Layout — mirrors Diagnostic ── */
  page: {
    minHeight: "100vh",
    margin: 0,
    background: "linear-gradient(140deg, #f3efe6 0%, #e5edf7 100%)",
    padding: 20,
    fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
  },
  pageHeader: {
    padding: 24,
  },
  shell: {
    maxWidth: 1060,
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: 14,
    boxShadow: "0 16px 36px rgba(31,45,63,0.15)",
    overflow: "hidden",
  },

  /* ── Header — same gradient as Diagnostic ── */
  header: {
    padding: "22px 24px 14px",
    background: "linear-gradient(120deg, #1f2d3f 0%, #294a67 100%)",
    position: "relative",
    textAlign: "center",
  },
  backBtn: {
    position: "absolute",
    top: 18,
    left: 18,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 4px",
    fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    margin: 0,
    marginBottom: 9,
  },

  /* ── Filter bar ── */
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 14,
    padding: "16px 24px",
    background: "#f8f4ef",
    borderBottom: "1px solid #e2ddd7",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#5a4a3a",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  filterInput: {
    height: 34,
    padding: "0 10px",
    border: "1px solid #c8bfb5",
    borderRadius: 7,
    fontSize: 13,
    color: "#222",
    background: "#fff",
    outline: "none",
    minWidth: 160,
  },
  clearBtn: {
    height: 34,
    padding: "0 18px",
    background: "linear-gradient(90deg, #f59e0b, #2563eb)",
    border: "none",
    borderRadius: 7,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    alignSelf: "flex-end",
  },

  /* ── Body ── */
  body: { padding: "20px 24px 28px" },
  summaryRow: {
    display: "flex",
    gap: 10,
    marginBottom: 14,
  },
  chip: {
    background: "#eef2f7",
    border: "1px solid #cdd5e0",
    borderRadius: 20,
    padding: "3px 12px",
    fontSize: 12,
    color: "#334155",
  },
  info: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    padding: "40px 0",
  },
  errMsg: {
    textAlign: "center",
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 8,
    padding: "12px 20px",
    fontSize: 13,
  },

  /* ── Main table ── */
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    background: "linear-gradient(120deg, #1f2d3f 0%, #294a67 100%)",
    color: "#fff",
    padding: "9px 13px",
    textAlign: "center",
    fontWeight: 600,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  sortBtn: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  },
  td: {
    padding: "9px 13px",
    color: "#1a1a2e",
    verticalAlign: "middle",
    borderBottom: "1px solid #e8ecf0",
  },
  rowEven: { background: "#f8f6f2" },
  rowOdd:  { background: "#ffffff" },
  scoreCell:  { fontWeight: 700, color: "#1d4ed8", textAlign: "center" },
  weightCell: { fontWeight: 700, color: "#047857", textAlign: "center" },
  expandBtn: {
    background: "linear-gradient(90deg, #1f2d3f, #294a67)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  /* ── Detail sub-table ── */
  detailCell: {
    padding: "4px 0 14px 36px",
    background: "#f0ece6",
  },
  innerTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    marginTop: 8,
  },
  ith: {
    background: "#294a67",
    color: "#fff",
    padding: "7px 10px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 12,
  },
  itd: {
    padding: "7px 10px",
    color: "#333",
    borderBottom: "1px solid #dde3ea",
    verticalAlign: "top",
  },
  irowEven: { background: "#eef2f7" },
  irowOdd:  { background: "#f8fafc" },

    /* ── Pagination ── */
    pagination: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 22,
      paddingTop: 16,
      borderTop: "1px solid #e2ddd7",
    },
    pageBtn: {
      minWidth: 36,
      height: 32,
      padding: "0 10px",
      border: "1px solid #c8bfb5",
      borderRadius: 7,
      background: "#fff",
      color: "#1f2d3f",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      transition: "0.2s",
    },
    pageBtnActive: {
      background: "linear-gradient(120deg, #1f2d3f 0%, #294a67 100%)",
      color: "#fff",
      border: "1px solid #1f2d3f",
    },
    pageBtnDis: {
      opacity: 0.35,
      cursor: "not-allowed",
    },
    ellipsis: {
      fontSize: 13,
      color: "#888",
      padding: "0 4px",
      lineHeight: "32px",
    },
  };
