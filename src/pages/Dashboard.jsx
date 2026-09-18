import { useState, useEffect, useMemo } from "react";
import { authFetch } from "../utils/auth";
import { deleteSubmission, reactivateSubmission, downloadSubmissionsExcel } from "../services/Api";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";
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
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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
        setError("Could not reach the backend. Check your network or API server.");
        setLoading(false);
      });

    // In-progress drafts (within 24h window)
    authFetch("/api/admin/drafts")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDrafts(data.drafts || []);
      })
      .catch(() => {});
  }, []);

  // Reset to page 1 when filters or sort changes
  useEffect(() => { setPage(1); setExpanded(null); }, [searchQuery, dateFilter, pageSize, sortBy, sortOrder]);

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return submissions.filter((sub) => {
      const respStatus = String(sub.respondentStatus || sub.status || "Active").toLowerCase();
      if (respStatus === "inactive") return false;

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
      } else if (sortBy === "respondentStatus") {
        av = String(a.respondentStatus || a.status || "Active").toLowerCase();
        bv = String(b.respondentStatus || b.status || "Active").toLowerCase();
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

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "red",
    onConfirm: null,
  });

  const handleDelete = (submissionId, respondentName) => {
    const nameStr = respondentName ? ` for "${respondentName}"` : "";
    setConfirmModal({
      isOpen: true,
      title: "Delete submission?",
      message: `Do you want to delete submission${nameStr}? It will be removed from this list.`,
      confirmText: "Yes, Delete",
      confirmColor: "red",
      onConfirm: () => handleConfirmDelete(submissionId),
    });
  };

  const handleConfirmDelete = async (submissionId) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setDeleteError("");
    setDeletingId(submissionId);

    const result = await deleteSubmission(submissionId);
    setDeletingId(null);

    if (!result.success) {
      setDeleteError(result.message || "Unable to update submission status.");
      return;
    }

    setSubmissions((prev) =>
      prev.map((item) =>
        Number(item.id) === Number(submissionId)
          ? { ...item, respondentStatus: "Inactive", status: "Inactive" }
          : item
      )
    );
    setExpanded(null);
  };

  const handleReactivate = (submissionId) => {
    setConfirmModal({
      isOpen: true,
      title: "Reactivate Submission",
      message: "Are you sure you want to reactivate this submission? It will be moved back to the Active view.",
      confirmText: "Yes, Reactivate",
      confirmColor: "emerald",
      onConfirm: () => handleConfirmReactivate(submissionId),
    });
  };

  const handleConfirmReactivate = async (submissionId) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setDeleteError("");
    setDeletingId(submissionId);

    const result = await reactivateSubmission(submissionId);
    setDeletingId(null);

    if (!result.success) {
      setDeleteError(result.message || "Unable to reactivate submission.");
      return;
    }

    setSubmissions((prev) =>
      prev.map((item) =>
        Number(item.id) === Number(submissionId)
          ? { ...item, respondentStatus: "Active", status: "Active" }
          : item
      )
    );
    setExpanded(null);
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



  const downloadSubmissions = async () => {
    const result = await downloadSubmissionsExcel();

    if (!result.success || !result.data) {
      setError(result.message || "Unable to download submissions.");
      return;
    }

    const blob = result.data;

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "Submissions.xlsx";

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  };




  return (
    <div className="w-full">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-6 py-5 rounded-t-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions Dashboard</h1>
          <p className="text-sm text-slate-300 mt-1">All responses saved to the local database.</p>
          {/* (DB source of truth) */}
        </div>

        <button onClick={downloadSubmissions} className="flex items-center gap-2 rounded-md bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-amber-600" > 📥 Download Excel </button>

      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 pt-4">
        <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Search respondent" value={searchQuery}  onChange={(e) => setSearchQuery(e.target.value)} />
        <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}  >
          {DATE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}  >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      <div className="px-6 pb-7 pt-5">
        {/* In-progress drafts (auto-deleted after 24h) */}
        {drafts.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50">
            <div className="border-b border-amber-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-amber-800">
                In-Progress Assessments <span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs">{drafts.length}</span>
              </h2>
              <p className="text-xs text-amber-700">Saved drafts are automatically deleted 24 hours after the last activity.</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-amber-700">
                  <th className="px-4 py-2 font-semibold">Respondent</th>
                  <th className="px-4 py-2 font-semibold">Email</th>
                  <th className="px-4 py-2 font-semibold">Answered</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Last Active</th>
                  <th className="px-4 py-2 font-semibold">Expires In</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.id} className="border-t border-amber-100">
                    <td className="px-4 py-2 font-medium text-gray-800">{d.name || "—"}</td>
                    <td className="px-4 py-2 text-gray-600">{d.email || "—"}</td>
                    <td className="px-4 py-2 text-gray-600">{d.answeredCount}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{d.status}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{formatDate(d.updatedAt)}</td>
                    <td className="px-4 py-2 text-gray-600">{d.hoursRemaining != null ? `${d.hoursRemaining}h` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && <p className="py-10 text-center text-sm text-[#666]">Loading submissions...</p>}

        {!loading && error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-5 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && deleteError && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-5 py-3 text-center text-sm text-red-700">
            {deleteError}
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
                      <button className="text-xs font-semibold text-white" onClick={() => handleSort("respondentStatus")}>Status {sortIndicator("respondentStatus")}</button>
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
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              String(sub.respondentStatus || sub.status || "Active").toLowerCase() === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}>
                              {String(sub.respondentStatus || sub.status || "Active").toLowerCase() === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{formatDate(sub.timestamp)}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 text-center align-middle font-bold text-blue-700">{sub.totalScore}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 text-center align-middle font-bold text-emerald-700">{sub.totalWeightedScore}</td>
                          <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="whitespace-nowrap rounded-md bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-3 py-1 text-[11px] font-semibold text-white"
                                onClick={() => toggleExpand(globalIdx)}
                              >
                                {isOpen ? "Hide ▲" : "View ▼"}
                              </button>
                              {String(sub.respondentStatus || sub.status || "Active").toLowerCase() === "inactive" ? (
                                <button
                                  className="whitespace-nowrap rounded-md border border-emerald-400 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 disabled:opacity-50"
                                  onClick={() => handleReactivate(sub.id)}
                                  disabled={deletingId === sub.id}
                                >
                                  {deletingId === sub.id ? "Updating..." : "Activate"}
                                </button>
                              ) : (
                                <button
                                  className="whitespace-nowrap rounded-md border border-red-400 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 disabled:opacity-50"
                                  onClick={() => handleDelete(sub.id, sub.respondent)}
                                  disabled={deletingId === sub.id}
                                >
                                  {deletingId === sub.id ? "Updating..." : "Delete"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr key={`d-${globalIdx}`}>
                            <td colSpan={7} className="bg-[#f0ece6] pb-4 pl-9 pt-1">
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

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              confirmModal.confirmColor === "red" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            }`}>
              {confirmModal.confirmColor === "red" ? (
                <TrashIcon className="h-7 w-7" />
              ) : (
                <CheckIcon className="h-7 w-7" />
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-800">{confirmModal.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{confirmModal.message}</p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-1/2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`w-1/2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition ${
                  confirmModal.confirmColor === "red"
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
