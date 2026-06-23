import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, submitDiagnostic } from "../utils/auth";
import AuthHeader from "../component/AuthHeader.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Diagnostic() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [respondent, setRespondent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // Load questions using utility function
    getQuestions().then((result) => {
      if (result.success) {
        setQuestions(result.data);
        const initial = {};
        result.data.forEach((q) => {
          if (q.answer) initial[q.rowIndex] = q.answer;
        });
        setAnswers(initial);
      } else {
        setMessage({ type: "error", text: result.error });
      }
      setLoading(false);
    });
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

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one answer before saving.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      respondent: respondent.trim() || "Anonymous",
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
      setMessage({ type: "success", text: result.message });
      setShowSummary(true);
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setSaving(false);
  };

  const handleSaveDraft = () => {
    // Validate respondent name
    if (!respondent.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your name to save draft.",
      });
      return;
    }

    // Validate at least one answer
    if (Object.keys(answers).length === 0) {
      setMessage({
        type: "error",
        text: "Please answer at least one question to save draft.",
      });
      return;
    }

    // Save draft to localStorage
    const draftData = {
      respondent: respondent.trim(),
      answers: answers,
      savedAt: new Date().toISOString(),
      answeredCount: answeredCount,
      totalQuestions: questions.length,
    };

    localStorage.setItem("diagnostic_draft", JSON.stringify(draftData));
    setMessage({
      type: "success",
      text: `Draft saved! You answered ${answeredCount} of ${questions.length} questions.`,
    });
  };

  const handleLoadDraft = () => {
    const draft = localStorage.getItem("diagnostic_draft");
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        setRespondent(draftData.respondent);
        setAnswers(draftData.answers);
        setMessage({
          type: "success",
          text: `Draft loaded: ${draftData.answeredCount} of ${draftData.totalQuestions} questions answered.`,
        });
      } catch {
        setMessage({
          type: "error",
          text: "Could not load draft.",
        });
      }
    } else {
      setMessage({
        type: "error",
        text: "No draft found.",
      });
    }
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
                <p className="text-sm uppercase tracking-[0.28em] text-yellow-300/90">Diagnostic</p>
                <h1 className="mt-3 text-4xl font-serif font-semibold text-white md:text-5xl">
                  Leadership Reset Diagnostic
                </h1>
                <p className="mt-4 max-w-2xl text-slate-300 text-lg">
                  Reflect on your leadership choices and capture insights that matter.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-500/10 px-5 py-2 text-yellow-200 shadow-sm">
                LEAN IN COACHING
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-yellow-400/30 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Answered</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{answeredCount}/{questions.length}</h3>
              </div>
              <div className="rounded-3xl border border-yellow-400/30 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{totalScore}</h3>
              </div>
              <div className="rounded-3xl border border-yellow-400/30 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weight</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{questionMetrics.reduce((sum, q) => sum + q.weight, 0)}</h3>
              </div>
              <div className="rounded-3xl border border-yellow-400/30 bg-slate-950/85 p-6 shadow-[0_20px_80px_-40px_rgba(250,204,21,0.45)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weighted</p>
                <h3 className="mt-4 text-3xl font-semibold text-yellow-300">{totalWeightedScore}</h3>
              </div>
            </div>

            <div className="rounded-[28px] border border-yellow-400/20 bg-slate-950/85 p-6 shadow-xl shadow-yellow-500/10">
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

            {loading && (
              <p className="text-center text-slate-300 font-semibold py-8">
                Loading questions...
              </p>
            )}

            {!loading && (
              <div className="grid gap-6 md:grid-cols-2">
                {questionMetrics.map((q) => (
                  <div key={q.rowIndex} className="rounded-[28px] border border-yellow-400/10 bg-slate-950/85 p-6 shadow-lg shadow-yellow-500/5 transition hover:-translate-y-0.5 hover:shadow-xl">
                    <div className="flex flex-col gap-4">
                      <p className="text-lg font-medium text-white">
                        <span className="font-semibold text-yellow-300">{q.number}.</span> {q.question}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-1">Score: {q.score}</span>
                        <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-1">Weight: {q.weight}</span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-yellow-200">Weighted: {q.weightedScore}</span>
                      </div>
                    </div>

                    <select
                      value={q.selectedAnswer}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.rowIndex]: e.target.value }))}
                      className="mt-4 w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20"
                    >
                      <option value="" className="bg-slate-950 text-white">-- Select an answer --</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-950 text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3 mt-8">
              <button
                onClick={handleLoadDraft}
                disabled={saving}
                className="rounded-2xl bg-yellow-500 px-6 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400 disabled:opacity-50"
              >
                Load Draft
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-2xl bg-slate-800 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-slate-700 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-2xl bg-yellow-500 px-6 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400 disabled:opacity-50"
              >
                {saving ? "Publishing..." : "Publish Data"}
              </button>
            </div>

            {message && (
              <div className={`mt-6 rounded-2xl border px-4 py-4 text-center text-sm font-medium ${
                message.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Diagnostic;
