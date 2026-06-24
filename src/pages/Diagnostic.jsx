import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearDiagnosticDraft,fetchAuthProfile,getQuestions,loadDiagnosticDraft,saveDiagnosticDraft,submitDiagnostic,} from "../utils/auth";
import AuthHeader from "../component/AuthHeader.jsx";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Diagnostic() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [respondent, setRespondent] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const applyDraftData = (draftData, fallbackQuestionCount = 0) => {
    setRespondent(draftData.respondent || "");
    setMobile(draftData.mobile || "");
    setAnswers(draftData.answersByRow || {});
    setMessage({
      type: "success",
      text: `Draft loaded: ${draftData.answeredCount || 0} of ${draftData.totalQuestions || fallbackQuestionCount} questions answered.`,
    });
  };

  useEffect(() => {
    let active = true;

    const initializeDiagnostic = async () => {
      const [profileResult, questionResult] = await Promise.all([
        fetchAuthProfile(),
        getQuestions(),
      ]);

      if (!active) return;

      if (profileResult.success && profileResult.profile) {
        const profile = profileResult.profile;
        const firstName = String(profile.firstname || profile.firstName || "").trim();
        const lastName = String(profile.lastname || profile.lastName || "").trim();
        const fullName = `${firstName} ${lastName}`.trim() || String(profile.name || "").trim();
        const profileMobile = String(profile.mobile || profile.phone || profile.phoneNumber || "").trim();

        if (fullName) setRespondent(fullName);
        if (profileMobile) setMobile(profileMobile);
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

      const draftResult = await loadDiagnosticDraft();

      if (!active) return;

      if (draftResult.success && draftResult.data) {
        applyDraftData(draftResult.data, loadedQuestions.length);
      }

      setLoading(false);
    };

    initializeDiagnostic();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (showSummary) {
      const timer = setTimeout(() => {
        navigate("/welcome");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSummary, navigate]);

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

  const buildDraftPayload = () => ({
    respondent: respondent.trim() || "Anonymous",
    mobile: mobile.trim(),
    savedAt: new Date().toISOString(),
    answeredCount,
    totalQuestions: questions.length,
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
  });

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
      await clearDiagnosticDraft();
      setMessage({ type: "success", text: result.message });
      setShowSummary(true);
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setSaving(false);
  };

  const handleSaveDraft = async () => {
    if (!respondent.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your name to save draft.",
      });
      return;
    }

    if (Object.keys(answers).length === 0) {
      setMessage({
        type: "error",
        text: "Please answer at least one question to save draft.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const result = await saveDiagnosticDraft(buildDraftPayload());

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || `Draft saved! You answered ${answeredCount} of ${questions.length} questions.`,
      });
    } else {
      setMessage({
        type: "error",
        text: result.message,
      });
    }

    setSaving(false);
  };

  if (showSummary) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16">
          <AuthHeader />
          <div className="rounded-[32px] border border-yellow-400/20 bg-slate-900/95 p-10 shadow-[0_35px_120px_-30px_rgba(250,204,21,0.45)] backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-300 shadow-lg shadow-yellow-500/20">
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-4xl font-serif font-semibold text-white">
                Thank you, {respondent || 'Leader'}
              </h2>
              <p className="max-w-2xl text-slate-300 text-lg">
                Your Leadership Diagnostic has been recorded successfully. You will be redirected to the welcome screen shortly.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-yellow-400/15 bg-slate-950/80 p-6 shadow-xl shadow-yellow-500/10">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Total Score</p>
                <h3 className="mt-4 text-5xl font-semibold text-white">{totalScore}</h3>
              </div>
              <div className="rounded-3xl border border-yellow-400/15 bg-slate-950/80 p-6 shadow-xl shadow-yellow-500/10">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Weighted Score</p>
                <h3 className="mt-4 text-5xl font-semibold text-yellow-300">{totalWeightedScore}</h3>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-yellow-400/10 bg-slate-950/85 p-6 text-left shadow-lg shadow-yellow-500/10">
              <p className="text-slate-300">
                Redirecting to the welcome page in 5 seconds. If you would like to continue, please wait or return manually.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        <AuthHeader />
        <div className="rounded-[32px] border border-yellow-400/20 bg-slate-900/95 p-8 shadow-[0_35px_120px_-30px_rgba(250,204,21,0.45)] backdrop-blur-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                {/* <p className="text-sm uppercase tracking-[0.28em] text-yellow-300/90">Diagnostic</p> */}

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
              {/* <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-500/10 px-5 py-2 text-yellow-200 shadow-sm">
                LEAN IN COACHING
              </span> */}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl  border border-white/40 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Answered</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{answeredCount}/{questions.length}</h3>
              </div>
              <div className="rounded-3xl border border-white/40 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{totalScore}</h3>
              </div>
              <div className="rounded-3xl border border-white/40 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weight</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{questionMetrics.reduce((sum, q) => sum + q.weight, 0)}</h3>
              </div>
              <div className="rounded-3xl border border-white/40 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weighted</p>
                <h3 className="mt-4 text-3xl font-semibold text-yellow-300">{totalWeightedScore}</h3>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/40 bg-slate-950/85 p-6 shadow-xl shadow-yellow-500/10">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300/90 mb-3">
                    Respondent Name
                  </label>
                  <input
                    type="text"
                    value={respondent}
                    placeholder="Enter respondent name"
                    onChange={(e) => setRespondent(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300/90 mb-3">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    placeholder="Enter mobile number"
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20"
                  />
                </div>
              </div>
            </div>

            {loading && (
              <p className="text-center text-slate-300 font-semibold py-8">
                Loading questions...
              </p>
            )}

            {!loading && (
              <div className="grid gap-6 md:grid-cols-2 items-stretch">
                {questionMetrics.map((q) => (
                  // <div key={q.rowIndex} className="rounded-[28px] border border-yellow-400/10 bg-slate-950/85 p-6 shadow-lg shadow-yellow-500/5 transition hover:-translate-y-0.5 hover:shadow-xl">

                  <div key={q.rowIndex} className="flex min-h-[250px] flex-col rounded-[28px] border border-yellow-400/10 bg-slate-950/85 p-6 shadow-lg shadow-yellow-500/5 transition hover:-translate-y-0.5 hover:shadow-xl"  >
                    {/* <div className="flex flex-col gap-4">
                      <p className="text-lg font-medium text-white">
                        <span className="font-semibold text-yellow-300">{q.number}.</span> {q.question}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-1">Score: {q.score}</span>
                        <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-1">Weight: {q.weight}</span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-yellow-200">Weighted: {q.weightedScore}</span>
                      </div>
                    </div> */}

                    <div className="flex flex-col gap-4">
                      <p className="h-[72px] text-lg font-medium text-white">
                        <span className="font-semibold text-yellow-300">{q.number}.</span>
                        {" "}
                        {q.question}
                      </p>

                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-1">
                          Score: {q.score}
                        </span>
                        <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-1">
                          Weight: {q.weight}
                        </span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-yellow-200">
                          Weighted: {q.weightedScore}
                        </span>
                      </div>
                    </div>

                    <select value={q.selectedAnswer}
                     className="mt-auto w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20"
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.rowIndex]: e.target.value,
                        }))
                      }                   
                    >
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

            <div className="grid gap-4 md:grid-cols-2 mt-8">
              <button onClick={handleSaveDraft} disabled={saving} className="rounded-2xl bg-yellow-500 px-6 py-4 text-sm font-semibold 
                text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400 disabled:opacity-50" >
                Save Draft
              </button>
              <button onClick={handleSubmit} disabled={saving} className="rounded-2xl bg-yellow-500 px-6 py-4 text-sm 
                font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400 disabled:opacity-50" >
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
        </div>
      </div>
    </div >
  );
}

export default Diagnostic;
