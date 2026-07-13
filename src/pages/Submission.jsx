import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../utils/auth";
import { getRespondents } from "../services/Api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, } from "recharts";
import { useNavigate } from "react-router-dom";


const STATUS_COLORS = {
  submitted: "#22c55e",
  drafted: "#f59e0b",
  notStarted: "#ef4444",
};

const STATUS_LABELS = {
  submitted: "Submitted",
  drafted: "Drafted",
  notStarted: "Not Started",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getRespondentName(row) {
  const firstName = String(row?.firstName || "").trim();
  const lastName = String(row?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || String(row?.email || "").trim();
}

function getCompletedAnswerCount(questions) {
  return Array.isArray(questions)
    ? questions.filter((question) => String(question?.answer || "").trim() !== "").length
    : 0;
}

function classifySubmission(row) {
  const questions = Array.isArray(row?.questions) ? row.questions : [];
  const answeredCount = getCompletedAnswerCount(questions);
  const totalQuestions = questions.length || 0;

  if (totalQuestions > 0 && answeredCount >= totalQuestions) {
    return "submitted";
  }

  if (answeredCount > 0) {
    return "drafted";
  }

  return "notStarted";
}

function compareValues(left, right, dir = "asc") {
  const leftValue = String(left || "").toLowerCase();
  const rightValue = String(right || "").toLowerCase();
  const comparison = leftValue.localeCompare(rightValue, undefined, {
    numeric: true,
    sensitivity: "base",
  });

  return dir === "asc" ? comparison : -comparison;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function Submission() {
  const [submissions, setSubmissions] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState([]);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showNotStartedModal, setShowNotStartedModal] = useState(false);

  const [draftSearchQuery, setDraftSearchQuery] = useState("");
  const [draftAssessmentFilter, setDraftAssessmentFilter] = useState("all");
  const [draftSortKey, setDraftSortKey] = useState("respondent_name");
  const [draftSortDir, setDraftSortDir] = useState("asc");
  const [draftPageSize, setDraftPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [draftCurrentPage, setDraftCurrentPage] = useState(1);

  const [notStartedSearchQuery, setNotStartedSearchQuery] = useState("");
  const [notStartedSortKey, setNotStartedSortKey] = useState("respondent");
  const [notStartedSortDir, setNotStartedSortDir] = useState("asc");
  const [notStartedPageSize, setNotStartedPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [notStartedCurrentPage, setNotStartedCurrentPage] = useState(1);

  const navigate = useNavigate();


  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [submissionResponse, draftResponse, respondentResponse] = await Promise.all([
          authFetch("/api/submissions"), authFetch("/api/auth/drafts"),
          getRespondents(),
        ]);


        const submissionJson = await submissionResponse.json().catch(() => null);
        const draftJson = await draftResponse.json();

        const submissionRows = Array.isArray(submissionJson?.submissions)
          ? submissionJson.submissions
          : [];

        const draftRows = Array.isArray(draftJson.drafts)
          ? draftJson.drafts
          : [];

        if (!active) return;

        if (!submissionResponse.ok || submissionJson?.success === false) {
          throw new Error(submissionJson?.error || submissionJson?.message || "Unable to load submissions.");
        }

        setSubmissions(submissionRows);
        setDrafts(draftRows);
        setRespondents(Array.isArray(respondentResponse.data) ? respondentResponse.data : []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message || "Unable to load submission summary.");
        setSubmissions([]);
        setDrafts([]);
        setRespondents([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const statusByRespondent = new Map();
    const startedRespondents = new Set();
    const draftedRespondents = new Set();

    submissions.forEach((row) => {
      const respondentKey = normalizeText(row?.respondent);
      if (!respondentKey) return;

      startedRespondents.add(respondentKey);

      const nextStatus = classifySubmission(row);
      const currentStatus = statusByRespondent.get(respondentKey);

      if (currentStatus === "submitted") return;
      if (nextStatus === "submitted") {
        statusByRespondent.set(respondentKey, "submitted");
        return;
      }
      if (!currentStatus || currentStatus === "notStarted") {
        statusByRespondent.set(respondentKey, nextStatus);
      }
    });

    drafts.forEach((row) => {
      const respondentKey = normalizeText(row?.respondent_name);
      if (respondentKey) {
        draftedRespondents.add(respondentKey);
      }
    });

    const submitted = Array.from(statusByRespondent.values()).filter((status) => status === "submitted").length;
    const drafted = drafts.length;
    const respondentNames = respondents.map(getRespondentName).filter(Boolean).map(normalizeText);
    const respondentCount = new Set(respondentNames).size;
    const activeRespondents = new Set([...startedRespondents, ...draftedRespondents]);
    const notStarted = Math.max(respondentCount - activeRespondents.size, 0);

    return {
      submitted,
      drafted,
      notStarted,
      total: submitted + drafted + notStarted,
      respondentCount,
      startedCount: startedRespondents.size,
    };
  }, [respondents, submissions, drafts]);

  const notStartedRespondents = useMemo(() => {
    // Respondents who submitted
    const completedSet = new Set(
      submissions.map((item) => normalizeText(item.respondent))
    );

    // Respondents who have drafts
    const draftedSet = new Set(
      drafts.map((item) => normalizeText(item.respondent_name))
    );

    // Registered respondents who are in neither set
    return respondents.filter((respondent) => {
      const name = normalizeText(getRespondentName(respondent));

      return (
        !completedSet.has(name) &&
        !draftedSet.has(name)
      );
    });
  }, [respondents, submissions, drafts]);

  const draftAssessmentOptions = useMemo(() => {
    const options = new Set(
      drafts
        .map((item) => String(item?.assessment_type || "").trim())
        .filter(Boolean)
    );
    return Array.from(options).sort((a, b) => compareValues(a, b, "asc"));
  }, [drafts]);

  const filteredSortedDrafts = useMemo(() => {
    const query = normalizeText(draftSearchQuery);
    const filtered = drafts.filter((draft) => {
      const matchesQuery =
        !query ||
        [draft?.respondent_name, draft?.email, draft?.mobile, draft?.assessment_type]
          .map(normalizeText)
          .some((value) => value.includes(query));

      const matchesAssessment =
        draftAssessmentFilter === "all" ||
        String(draft?.assessment_type || "") === draftAssessmentFilter;

      return matchesQuery && matchesAssessment;
    });

    filtered.sort((a, b) => {
      if (draftSortKey === "updated_at") {
        const leftTime = new Date(a?.updated_at || 0).getTime();
        const rightTime = new Date(b?.updated_at || 0).getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return draftSortDir === "asc" ? safeLeft - safeRight : safeRight - safeLeft;
      }

      return compareValues(a?.[draftSortKey], b?.[draftSortKey], draftSortDir);
    });

    return filtered;
  }, [drafts, draftSearchQuery, draftAssessmentFilter, draftSortKey, draftSortDir]);

  const draftTotalPages = Math.max(1, Math.ceil(filteredSortedDrafts.length / draftPageSize));

  const safeDraftCurrentPage = Math.min(draftCurrentPage, draftTotalPages);

  const paginatedDrafts = useMemo(() => {
    const start = (safeDraftCurrentPage - 1) * draftPageSize;
    return filteredSortedDrafts.slice(start, start + draftPageSize);
  }, [filteredSortedDrafts, safeDraftCurrentPage, draftPageSize]);

  const filteredSortedNotStarted = useMemo(() => {
    const query = normalizeText(notStartedSearchQuery);
    const rows = notStartedRespondents.map((person) => ({
      ...person,
      respondent: getRespondentName(person),
      registeredDate: person?.createdAt,
    }));

    const filtered = rows.filter((row) => {
      if (!query) return true;
      return [row?.respondent, row?.email, row?.mobile, row?.status]
        .map(normalizeText)
        .some((value) => value.includes(query));
    });

    filtered.sort((a, b) => {
      if (notStartedSortKey === "registeredDate") {
        const leftTime = new Date(a?.registeredDate || 0).getTime();
        const rightTime = new Date(b?.registeredDate || 0).getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return notStartedSortDir === "asc" ? safeLeft - safeRight : safeRight - safeLeft;
      }

      return compareValues(a?.[notStartedSortKey], b?.[notStartedSortKey], notStartedSortDir);
    });

    return filtered;
  }, [notStartedRespondents, notStartedSearchQuery, notStartedSortKey, notStartedSortDir]);

  const notStartedTotalPages = Math.max(
    1,
    Math.ceil(filteredSortedNotStarted.length / notStartedPageSize)
  );

  const safeNotStartedCurrentPage = Math.min(notStartedCurrentPage, notStartedTotalPages);

  const paginatedNotStarted = useMemo(() => {
    const start = (safeNotStartedCurrentPage - 1) * notStartedPageSize;
    return filteredSortedNotStarted.slice(start, start + notStartedPageSize);
  }, [filteredSortedNotStarted, safeNotStartedCurrentPage, notStartedPageSize]);

  const onDraftSort = (key) => {
    if (draftSortKey === key) {
      setDraftSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setDraftSortKey(key);
    setDraftSortDir("asc");
  };

  const onNotStartedSort = (key) => {
    if (notStartedSortKey === key) {
      setNotStartedSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setNotStartedSortKey(key);
    setNotStartedSortDir("asc");
  };

  const sortIndicator = (activeKey, activeDir, key) => {
    if (activeKey !== key) return "";
    return activeDir === "asc" ? " ▲" : " ▼";
  };

  const onStatusClick = (statusKey) => {
    switch (statusKey) {
      case "submitted":
        navigate("/dash-submissions");
        break;

      case "drafted":
        setDraftCurrentPage(1);
        setShowDraftModal(true);
        break;

      case "notStarted":
        setNotStartedCurrentPage(1);
        setShowNotStartedModal(true);
        break;

      default:
        break;
    }
  };

  const chartData = useMemo(
    () => [
      { key: "submitted", label: STATUS_LABELS.submitted, value: summary.submitted, color: STATUS_COLORS.submitted },
      { key: "drafted", label: STATUS_LABELS.drafted, value: summary.drafted, color: STATUS_COLORS.drafted },
      { key: "notStarted", label: STATUS_LABELS.notStarted, value: summary.notStarted, color: STATUS_COLORS.notStarted },
    ],
    [summary.submitted, summary.drafted, summary.notStarted]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f3efe6] to-[#e5edf7] p-5">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[18px] bg-white shadow-[0_18px_42px_rgba(31,45,63,0.14)]">
        <header className="bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-6 py-6 text-center text-white">
          <h1 className="text-2xl font-bold md:text-3xl">Assessment Submission Summary</h1>
          <p className="mt-1 text-sm text-white/75">submitted, drafted, and not started assessments in one view</p>
        </header>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[360px_1fr] lg:items-center">
          <section className="rounded-[18px] border border-[#dbe3ed] bg-[#f8f4ef] p-5 shadow-[0_8px_24px_rgba(31,45,63,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Assessment Status</h2>
                {/* <p className="text-sm text-slate-600">Pie chart by assessment progress</p> */}
              </div>
              <span className="rounded-full border border-[#cdd5e0] bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Total: {summary.total}
              </span>
            </div>

            {loading ? (
              <div className="flex h-[320px] items-center justify-center rounded-[18px] bg-white text-sm text-slate-600">
                Loading chart...
              </div>
            ) : error ? (
              <div className="rounded-[18px] border border-red-300 bg-red-50 px-4 py-5 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <>
                <div className="mx-auto h-[320px] w-full max-w-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={120} innerRadius={80}
                      >
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={entry.color}
                            style={{ cursor: "pointer" }}
                            onClick={() => onStatusClick(entry.key)}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </section>

          <section className="rounded-[18px] border border-[#dbe3ed] bg-white p-5 shadow-[0_8px_24px_rgba(31,45,63,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
                <p className="text-sm text-slate-600">Based on current submissions and registered respondents</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                <span className="rounded-full border border-[#cdd5e0] bg-[#eef2f7] px-3 py-1">Submitted: {summary.startedCount}</span>
                <span className="rounded-full border border-[#cdd5e0] bg-[#eef2f7] px-3 py-1">Registered: {summary.respondentCount}</span>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                Loading assessment data...
              </div>
            ) : !error && summary.total > 0 ? (
              <div className="overflow-hidden rounded-[14px] border border-[#dbe3ed]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f8f4ef] text-left text-slate-700">
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Count</th>
                      <th className="px-4 py-3 font-semibold">Color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item) => (
                      <tr key={item.key} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                        <td className="px-4 py-3 text-slate-700">{item.value}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.color}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !error ? (
              <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                No assessment records found yet.
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl">

            <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67]
                px-6 py-5 rounded-t-lg">
              <h1 className="text-2xl font-bold text-white"> Draft Assessments </h1>
              <button onClick={() => setShowDraftModal(false)} className="text-3xl text-gray-500 hover:text-black" > × </button>
            </div>

            <div className="mb-4 ml-4 grid grid-cols-1 gap-3 md:grid-cols-4 pt-4">
              <input
                type="text"
                value={draftSearchQuery}
                onChange={(e) => {
                  setDraftSearchQuery(e.target.value);
                  setDraftCurrentPage(1);
                }}
                placeholder="Search name, email, mobile"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />

              <select
                value={draftAssessmentFilter}
                onChange={(e) => {
                  setDraftAssessmentFilter(e.target.value);
                  setDraftCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All Assessment</option>
                {draftAssessmentOptions.map((assessment) => (
                  <option key={assessment} value={assessment}>{assessment}</option>
                ))}
              </select>

              <select
                value={draftPageSize}
                onChange={(e) => {
                  setDraftPageSize(Number(e.target.value));
                  setDraftCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border mx-4">
              <div className="max-h-[500px] overflow-auto">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-[#24384F] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">
                        <button type="button" onClick={() => onDraftSort("respondent_name")}>
                          Respondent{sortIndicator(draftSortKey, draftSortDir, "respondent_name")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        <button type="button" onClick={() => onDraftSort("answered_count")}>
                          Answered{sortIndicator(draftSortKey, draftSortDir, "answered_count")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        <button type="button" onClick={() => onDraftSort("mobile")}>
                          Mobile{sortIndicator(draftSortKey, draftSortDir, "mobile")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        <button type="button" onClick={() => onDraftSort("email")}>
                          Email{sortIndicator(draftSortKey, draftSortDir, "email")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        <button type="button" onClick={() => onDraftSort("updated_at")}>
                          DraftDate{sortIndicator(draftSortKey, draftSortDir, "updated_at")}
                        </button>
                      </th>
                      {/* <th className="px-6 py-4 text-left font-semibold">
                        <button type="button" onClick={() => onDraftSort("assessment_type")}>
                          Assessment{sortIndicator(draftSortKey, draftSortDir, "assessment_type")}
                        </button>
                      </th> */}
                      <th className="px-6 py-4 text-center font-semibold">Status </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedDrafts.map((draft, index) => (
                      <tr key={draft.id} className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`} >
                        <td className="px-6 py-5">{draft.respondent_name} </td>
                        <td className="px-6 py-5 text-center">{draft.answered_count}/12</td>
                        <td className="px-6 py-5"> {draft.mobile}  </td>
                        <td className="px-6 py-5">  {draft.email} </td>
                        <td className="px-6 py-5">{formatDate(draft.updated_at)}  </td>
                        {/* <td className="px-6 py-5"> {draft.assessment_type} </td> */}
                        <td className="px-6 py-5 text-center">
                          <span className="rounded-full bg-yellow-100 px-4 py-1 text-sm font-medium text-yellow-700"> Draft  </span>
                        </td>
                      </tr>
                    ))}
                    {paginatedDrafts.length === 0 && (
                      <tr>
                        <td colSpan={7}  className="py-10 text-center text-gray-500" >No Draft Assessments Found </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-5">
              <p className="text-gray-600">
                Showing {filteredSortedDrafts.length === 0 ? 0 : (safeDraftCurrentPage - 1) * draftPageSize + 1}-
                {Math.min(safeDraftCurrentPage * draftPageSize, filteredSortedDrafts.length)} of {filteredSortedDrafts.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safeDraftCurrentPage <= 1}
                  onClick={() => setDraftCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="rounded-lg border px-5 py-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button className="rounded-lg bg-[#24384F] px-5 py-2 text-white">
                  {safeDraftCurrentPage} / {draftTotalPages}
                </button>

                <button
                  type="button"
                  disabled={safeDraftCurrentPage >= draftTotalPages}
                  onClick={() => setDraftCurrentPage((prev) => Math.min(prev + 1, draftTotalPages))}
                  className="rounded-lg border px-5 py-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotStartedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-6 py-5 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white"> Not Started Assessments </h2>
              <button onClick={() => setShowNotStartedModal(false)}   className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow/10 text-white transition hover:bg-white/40" > × </button>
            </div>

            <div className="mb-4 ml-4 grid grid-cols-1 gap-3 md:grid-cols-4 pt-4">
              <input
                type="text"
                value={notStartedSearchQuery}
                onChange={(e) => {
                  setNotStartedSearchQuery(e.target.value);
                  setNotStartedCurrentPage(1);
                }}
                placeholder="Search name, email, mobile"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />


              <select
                value={notStartedPageSize}
                onChange={(e) => {
                  setNotStartedPageSize(Number(e.target.value));
                  setNotStartedCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border mx-4">
              <div className="max-h-[500px] overflow-auto">
                <table className="min-w-full border-collapse text-[13px]">
                  <thead className="sticky top-0 bg-[#24384F] text-white">
                    <tr>
                      <th className="px-6 py-4 text-center text-xs font-semibold">
                        <button type="button" onClick={() => onNotStartedSort("respondent")}>Respondent{sortIndicator(notStartedSortKey, notStartedSortDir, "respondent")}</button>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold">
                        <button type="button" onClick={() => onNotStartedSort("email")}>Email{sortIndicator(notStartedSortKey, notStartedSortDir, "email")}</button>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold">
                        <button type="button" onClick={() => onNotStartedSort("mobile")}>Mobile{sortIndicator(notStartedSortKey, notStartedSortDir, "mobile")}</button>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold">
                        <button type="button" onClick={() => onNotStartedSort("status")}>Status{sortIndicator(notStartedSortKey, notStartedSortDir, "status")}</button>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold">
                        <button type="button" onClick={() => onNotStartedSort("registeredDate")}>Registered Date{sortIndicator(notStartedSortKey, notStartedSortDir, "registeredDate")}</button>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedNotStarted.map((person, i) => (
                      <tr key={person.id} className={i % 2 === 0 ? "bg-[#f8f6f2]" : "bg-white"}>
                        <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{person.respondent}</td>
                        <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{person.email}</td>
                        <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{person.mobile}</td>
                        <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{person.status || "Pending"}</td>
                        <td className="border-b border-[#e8ecf0] px-3 py-2 align-middle text-[#1a1a2e] text-center">{formatDate(person.registeredDate)}</td>
                      </tr>
                    ))}
                    {paginatedNotStarted.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-gray-500" >No respondents pending.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-5">
              <p className="text-gray-600">
                Showing {filteredSortedNotStarted.length === 0 ? 0 : (safeNotStartedCurrentPage - 1) * notStartedPageSize + 1}-
                {Math.min(safeNotStartedCurrentPage * notStartedPageSize, filteredSortedNotStarted.length)} of {filteredSortedNotStarted.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safeNotStartedCurrentPage <= 1}
                  onClick={() => setNotStartedCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="rounded-lg border px-5 py-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button className="rounded-lg bg-[#24384F] px-5 py-2 text-white">
                  {safeNotStartedCurrentPage} / {notStartedTotalPages}
                </button>
                <button
                  type="button"
                  disabled={safeNotStartedCurrentPage >= notStartedTotalPages}
                  onClick={() => setNotStartedCurrentPage((prev) => Math.min(prev + 1, notStartedTotalPages))}
                  className="rounded-lg border px-5 py-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
