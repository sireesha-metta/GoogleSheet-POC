import { useState, useEffect } from "react";
import { fetchAuthProfile, getDiagnosticSubmissionStatus, getAuthSession, getQuestions, submitDiagnostic } from "../utils/auth";
import AuthHeader from "../component/AuthHeader.jsx";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Diagnostic() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [respondent, setRespondent] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [submissionSnapshot, setSubmissionSnapshot] = useState(null);

  useEffect(() => {
    let active = true;

    const initializeDiagnostic = async () => {
      const [statusResult, profileResult, questionResult] = await Promise.all([
        getDiagnosticSubmissionStatus(),
        fetchAuthProfile(),
        getQuestions(),
      ]);

      if (!active) return;

      if (statusResult.success && statusResult.submitted) {
        const submittedData = statusResult.data || {};
        if (questionResult.success && Array.isArray(questionResult.data)) {
          setQuestions(questionResult.data);
        }
        if (submittedData.answersByRow) {
          setAnswers(submittedData.answersByRow);
        }
        if (submittedData.respondent) {
          setRespondent(String(submittedData.respondent));
        }
        if (submittedData.mobile) {
          setMobile(String(submittedData.mobile));
        }
        setSubmissionSnapshot(submittedData);
        setShowSummary(true);
        setLoading(false);
        return;
      }

      if (profileResult.success && profileResult.profile) {
        const profile = profileResult.profile;
        const firstName = String(profile.firstname || profile.firstName || "").trim();
        const lastName = String(profile.lastname || profile.lastName || "").trim();
        const fullName = `${firstName} ${lastName}`.trim() || String(profile.name || "").trim();
        const profileMobile = String(profile.mobile || profile.phone || profile.phoneNumber || "").trim();

        if (fullName) setRespondent(fullName);
        if (profileMobile) setMobile(profileMobile);
      }

      const session = getAuthSession();
      const sessionName = String(
        session?.name || `${session?.firstName || ""} ${session?.lastName || ""}`
      ).trim();
      const sessionMobile = String(
        session?.mobile || session?.phone || session?.phoneNumber || ""
      ).trim();

      if (sessionName) {
        setRespondent((prev) => prev || sessionName);
      }

      if (sessionMobile) {
        setMobile((prev) => prev || sessionMobile);
      }


      if (!questionResult.success) {
        setMessage({ type: "error", text: questionResult.error });
        setLoading(false);
        return;
      }

      const loadedQuestions = questionResult.data;
      setQuestions(loadedQuestions);

      const initialAnswers = {};
      loadedQuestions.forEach((q) => {
        if (q.answer) initialAnswers[q.rowIndex] = q.answer;
      });
      setAnswers(initialAnswers);

      // /api/draft load support was removed from the app-level flow.
      if (!active) return;

      setLoading(false);
    };

    initializeDiagnostic();

    return () => {
      active = false;
    };
  }, []);

  const answeredCount = questions.filter(
    (q) => (answers[q.rowIndex] || "").trim() !== "").length;

  const questionMetrics = questions.map((q) => {
    const selectedAnswer = answers[q.rowIndex] || "";
    const score = toNumber(q.optionScoreMap?.[selectedAnswer]);
    const weight = toNumber(q.weight);
    const weightedScore = score * weight;
    return { ...q, selectedAnswer, score, weight, weightedScore };
  });

  const totalScore = questionMetrics.reduce((sum, q) => sum + q.score, 0);
  const totalWeightedScore = questionMetrics.reduce(
    (sum, q) => sum + q.weightedScore,
    0
  );

  const summaryResponses = submissionSnapshot?.questionResponses?.length
    ? submissionSnapshot.questionResponses
    : questionMetrics
      .filter((q) => (q.selectedAnswer || "").trim() !== "")
      .map((q) => ({
        rowIndex: q.rowIndex,
        number: q.number,
        question: q.question,
        answer: q.selectedAnswer,
      }));

  const handleSubmit = async () => {
    if (!respondent.trim()) {
      setMessage({
        type: "error",
        text: "Please enter respondent name.",
      });
      return;
    }

    if (!mobile.trim()) {
      setMessage({
        type: "error",
        text: "Please enter mobile number.",
      });
      return;
    }

    const unansweredQuestions = questionMetrics.filter(
      (q) => !answers[q.rowIndex]
    );

    if (unansweredQuestions.length > 0) {
      setMessage({
        type: "error",
        text: `Please answer all questions before publishing. ${unansweredQuestions.length} question(s) remaining.`,
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      respondent: respondent.trim(),
      mobile: mobile.trim(),
      submittedAt: new Date().toISOString(),
      totalScore,
      totalWeightedScore,
      answersByRow: answers,
      questionResponses: questionMetrics.map((q) => ({
        rowIndex: q.rowIndex,
        number: q.number,
        question: q.question,
        answer: q.selectedAnswer,
        score: q.score,
        weight: q.weight,
        weightedScore: q.weightedScore,
      })),
    };

    const result = await submitDiagnostic(payload);

    if (result.success) {
      // /api/draft clear support was removed from the app-level flow.
      setMessage({ type: "success", text: result.message });
      setSubmissionSnapshot({
        respondent: payload.respondent,
        mobile: payload.mobile,
        submittedAt: payload.submittedAt,
        totalScore: payload.totalScore,
        totalWeightedScore: payload.totalWeightedScore,
        answersByRow: payload.answersByRow,
        questionResponses: payload.questionResponses,
      });
      setShowSummary(true);
    } else if (result.alreadySubmitted) {
      const submittedData = result.data || {};
      if (submittedData.respondent) {
        setRespondent(String(submittedData.respondent));
      }
      if (submittedData.mobile) {
        setMobile(String(submittedData.mobile));
      }
      setSubmissionSnapshot(submittedData);
      setMessage({ type: "success", text: result.message || "Assessment already submitted." });
      setShowSummary(true);
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setSaving(false);
  };

  if (showSummary) {
    const summaryRespondent = submissionSnapshot?.respondent || respondent || "Leader";
    const summaryTotalScore = Number(submissionSnapshot?.totalScore ?? totalScore ?? 0);
    const summaryWeightedScore = Number(submissionSnapshot?.totalWeightedScore ?? totalWeightedScore ?? 0);

    return (
      <div className="min-h-screen bg-[#0F172A] text-white">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1E293B]" />

        <header className="sticky top-0 z-50 text-black">
          <AuthHeader />
        </header>

        <main className="mx-auto flex max-w-5xl flex-col items-center px-6 py-12">

          <div className="flex h-15 w-15 items-center justify-center rounded-full border border-yellow-300/30 bg-yellow-400/10 shadow-lg shadow-yellow-400/20">
            <span className="text-3xl text-yellow-200">✓</span>
          </div>

          <h1 className="mt-4 text-center text-3xl font-serif font-bold">
            Thank You , {""}
            <span className=" text-yellow-200"> {summaryRespondent} </span>
          </h1>

          <p className="mt-3 max-w-xl text-center text-lg leading-8 text-slate-200">
            Your Leadership Reset Diagnostic has been submitted successfully.
            Your responses have been recorded and will help generate meaningful
            leadership insights.
          </p>

          <div className="mt-6 grid w-full gap-2 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-400 bg-[#1E293B] p-6 shadow-lg transition hover:-translate-y-1 hover:border-yellow-400/40">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-100">Total Score </p>
              <h2 className="mt-2 text-4xl font-bold text-white">{summaryTotalScore}</h2>
            </div>

            <div className="rounded-3xl border border-slate-400 bg-[#1E293B] p-6 shadow-lg transition hover:-translate-y-1 hover:border-yellow-400/40">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-100">Weighted Score</p>
              <h2 className="mt-2 text-4xl font-bold text-yellow-300">{summaryWeightedScore} /100</h2>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-600 bg-[#1E293B] p-8">

            <h2 className="mb-6 text-2xl font-semibold text-yellow-300">{summaryRespondent} Responses </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 text-left">
                    <th className="p-3 text-yellow-300">#</th>
                    <th className="p-3 text-yellow-300"> Question </th>
                    <th className="p-3 text-yellow-300">Selected Response</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryResponses.map((q) => (
                    <tr key={q.rowIndex} className="border-b border-slate-700 hover:bg-slate-800/40"   >
                      <td className="p-3">{q.number}</td>
                      <td className="p-3">{q.question}</td>
                      <td className="p-3">{q.answer ?? submissionSnapshot?.answersByRow?.[q.rowIndex] ?? "-"}  </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1E293B]" />

      <div className=" sticky top-0 z-50 text-black">
        <AuthHeader />
      </div>

      <main className="flex-1 relative z-10 mx-auto w-full max-w-6xl px-6 py-8">
        {loading ? (
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
              <p className="mt-4 text-slate-300">Loading assessment...</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-500/10 px-5 py-2 text-yellow-200 shadow-sm">
                  LEAN IN COACHING
                </span>
                <h1 className="mt-3 text-4xl font-serif font-semibold text-white md:text-5xl">
                  Leadership Reset Diagnostic
                </h1>
                <p className="mt-4 max-w-2xl text-slate-300 text-lg">
                  Reflect on your leadership choices and capture insights that matter.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-700 bg-[#1E293B] p-6 transition-all duration-300 hover:border-yellow-400/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Answered</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{answeredCount}/{questions.length}</h3>
              </div>
              
              <div className="rounded-3xl border border-slate-700 bg-[#1E293B] p-6 transition-all duration-300 hover:border-yellow-400/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weight</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{questionMetrics.reduce((sum, q) => sum + q.weight, 0)}</h3>
              </div>
              <div className="rounded-3xl border border-slate-700 bg-[#1E293B] p-6 transition-all duration-300 hover:border-yellow-400/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score-Auto</p>
                <h3 className="mt-4 text-3xl font-semibold text-yellow-300">{totalWeightedScore}</h3>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-700 bg-[#1E293B] p-8 shadow-lg">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300/90 mb-3">Respondent Name</label>
                  <input type="text" value={respondent} placeholder="Enter respondent name" onChange={(e) => setRespondent(e.target.value)}
                    disabled className="w-full rounded-2xl border border-slate-700 bg-slate-700/60 px-4 py-3 text-slate-300 cursor-not-allowed" />
                </div>

                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300/90 mb-3">Mobile Number</label>
                  <input type="tel" value={mobile} placeholder="Enter mobile number" disabled onChange={(e) => setMobile(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-700/60 px-4 py-3 text-slate-300 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {loading && (
              <p className="text-center text-slate-300 font-semibold py-8">
                Loading questions...
              </p>
            )}

            {!loading && (
              <div>
                {questionMetrics.map((q) => (
                  <div key={q.rowIndex} className="mb-6 flex min-h-[250px] flex-col rounded-[28px] border border-slate-700 bg-gradient-to-br from-[#111827] to-[#1E293B] p-8 transition-all duration-300 hover:border-yellow-400/40 hover:shadow-xl hover:shadow-yellow-500/10"  >

                    <div className="flex flex-col">
                      <p className="h-[72px] text-lg font-medium text-white">
                        <span className="font-semibold text-yellow-300">{q.number}.</span>
                        {" "}   {q.question}
                      </p>

                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-yellow-200">
                          Score-auto: {q.weightedScore}
                        </span>
                        <span className="rounded-full border border-slate-800/80 bg-[#0F172A] border-slate-600 px-3 py-1">
                          Weight: {q.weight}
                        </span>

                      </div>
                    </div>

                    <select value={q.selectedAnswer}
                      className="mt-auto w-full rounded-2xl border border-slate-700/70 bg-[#0F172A] border-slate-600 px-4 py-3 text-white outline-none transition focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20"
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.rowIndex]: e.target.value, }))} >
                      <option value="">-- Select an answer --</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-1 mt-8">
              <button onClick={handleSubmit} disabled={saving} className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-4 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:from-yellow-300 hover:to-amber-400 hover:scale-[1.02]" >
                {saving ? "Publishing..." : "Publish Data"}
              </button>
            </div>

            {message && (
              <div className={`mt-6 rounded-2xl border px-4 py-4 text-center text-sm font-medium ${message.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                }`}>
                {message.text}
              </div>
            )}
          </div>
        )}
      </main>
    </div >
  );
}

export default Diagnostic;
