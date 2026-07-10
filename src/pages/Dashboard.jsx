import { useState, useEffect, useMemo } from "react";
import { authFetch } from "../utils/auth";
// import AuthHeader from "../component/AuthHeader.jsx";

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const DATE_FILTER_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
];


function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleString();
}

export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

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
  useEffect(() => { setPage(1); setExpanded(null); }, [searchQuery, dateFilter, pageSize, sortBy, sortOrder]);

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return submissions.filter((sub) => {
      const respondent = String(sub.respondent || "").toLowerCase();
      const query = String(searchQuery || "").trim().toLowerCase();

      if (query && !respondent.includes(query)) return false;

      if (dateFilter !== "all") {
        const submittedAt = new Date(sub.timestamp || 0);
        if (isNaN(submittedAt)) return false;

        if (dateFilter === "today") {
          const start = today;
          const end = new Date(today);
          end.setDate(end.getDate() + 1);
          if (!(submittedAt >= start && submittedAt < end)) return false;
        }

        if (dateFilter === "last7") {
          const start = new Date(today);
          start.setDate(start.getDate() - 6);
          const end = new Date(today);
          end.setDate(end.getDate() + 1);
          if (!(submittedAt >= start && submittedAt < end)) return false;
        }

        if (dateFilter === "last30") {
          const start = new Date(today);
          start.setDate(start.getDate() - 29);
          const end = new Date(today);
          end.setDate(end.getDate() + 1);
          if (!(submittedAt >= start && submittedAt < end)) return false;
        }

        if (dateFilter === "thisMonth") {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          if (!(submittedAt >= start && submittedAt < end)) return false;
        }
      }

      return true;
    });
  }, [submissions, searchQuery, dateFilter]);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
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
    <div className="w-full">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67]
                px-6 py-5 rounded-t-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions Dashboard</h1>
          <p className="text-sm text-slate-300">All responses saved to Google Sheets</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 pt-4">
        <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Search respondent" value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} />

        <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}  >
          {DATE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}  >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>        
      </div>

      <div className="px-6 pb-7 pt-5">
        {loading && <p className="py-10 text-center text-sm text-[#666]">Loading submissions...</p>}

        {!loading && error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-5 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-[#666]">No submissions match your filters.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-2 text-center text-xs font-semibold text-white">S.No</th>
                    <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-2 text-center text-xs font-semibold text-white">
                      <button className="text-xs font-semibold text-white" onClick={() => handleSort("respondent")}>Respondent {sortIndicator("respondent")}</button>
                    </th>
                    <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-2 text-center text-xs font-semibold text-white">
                      <button className="text-xs font-semibold text-white" onClick={() => handleSort("timestamp")}>Submitted At {sortIndicator("timestamp")}</button>
                    </th>
                    <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-2 text-center text-xs font-semibold text-white">
                      <button className="text-xs font-semibold text-white" onClick={() => handleSort("totalScore")}>Total Score {sortIndicator("totalScore")}</button>
                    </th>
                    <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-2 text-center text-xs font-semibold text-white">
                      <button className="text-xs font-semibold text-white" onClick={() => handleSort("totalWeightedScore")}>Weighted Score {sortIndicator("totalWeightedScore")}</button>
                    </th>
                    <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-2 text-center text-xs font-semibold text-white">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.map((sub, i) => {
                    const globalIdx = (page - 1) * pageSize + i;
                    const isOpen = expanded === globalIdx;

                    return (
                      <>
                        <tr key={globalIdx} className={i % 2 === 0 ? "bg-[#f8f6f2]" : "bg-white"}>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{globalIdx + 1}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle font-semibold text-[#1a1a2e] text-center">{sub.respondent || "—"}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{formatDate(sub.timestamp)}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 text-center align-middle font-bold text-blue-700">{sub.totalScore}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 text-center align-middle font-bold text-emerald-700">{sub.totalWeightedScore}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">
                            <button
                              className="whitespace-nowrap rounded-md bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-1 text-[11px] font-semibold text-white"
                              onClick={() => toggleExpand(globalIdx)}
                            >
                              {isOpen ? "Hide ▲" : "View ▼"}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr key={`d-${globalIdx}`}>
                            <td colSpan={6} className="bg-[#f0ece6] pb-4 pl-9 pt-1">
                              <table className="mt-2 w-full border-collapse text-[13px]">
                                <thead>
                                  <tr>
                                    {["Q#", "Question", "Answer", "Score", "Weight"].map((h) => (
                                      <th key={h} className="bg-[#294a67] px-3 py-2 text-left text-xs font-semibold text-white">{h}</th>
                                    ))}
                                  </tr>
                                </thead>

                                <tbody>
                                  {(sub.questions || []).map((q, qi) => (
                                    <tr key={qi} className={qi % 2 === 0 ? "bg-[#eef2f7]" : "bg-[#f8fafc]"}>
                                      <td className="border-b border-[#dde3ea] px-3 py-2 align-top text-[#333]">{q.number}</td>
                                      <td className="max-w-[380px] border-b border-[#dde3ea] px-3 py-2 align-top leading-[1.4] text-[#333]">{q.question}</td>
                                      <td className="border-b border-[#dde3ea] px-3 py-2 align-top text-[#333]">{q.answer || "—"}</td>
                                      <td className="border-b border-[#dde3ea] px-3 py-2 text-center align-top text-[#333]">{q.score}</td>
                                      <td className="border-b border-[#dde3ea] px-3 py-2 text-center align-top text-[#333]">{q.weight}</td>
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2ddd7] pt-4">
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page === 1}
                onClick={() => { setPage((p) => Math.max(1, p - 1)); setExpanded(null); }}
              >
                Previous
              </button>

              <span className="text-sm text-slate-700">
                Page {page} / {totalPages}
              </span>

              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setExpanded(null); }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
      {/* </div> */}
      {/* </main> */}
    </div>
  );
}
