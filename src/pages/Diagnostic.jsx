import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/auth";

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

    console.log("Session:", localStorage.getItem("gspoc_auth_session"));
    authFetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        const initial = {};
        data.forEach((q) => {
          if (q.answer) initial[q.rowIndex] = q.answer;
        });
        setAnswers(initial);
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: "error", text: "Could not load questions." });
        setLoading(false);
      });
  }, []);

  const answeredCount = questions.filter(
    (q) => (answers[q.rowIndex] || "").trim() !== ""
  ).length;

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

    try {
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

      const res = await authFetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const success =
        text.toLowerCase().includes("success") ||
        text.toLowerCase().includes("saved");

      if (success) {
        setMessage({ type: "success", text: "Saved to Google Sheet!" });
        setShowSummary(true);
        // setTimeout(() => navigate("/welcome"), 8000);
      } else {
        setMessage({ type: "error", text: text || "Save failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  if (showSummary) {
    return (
      <div className="summary-page">
        <div className="summary-card">
          {/* <div className="summary-icon">✓</div> */}
          <h2>Hello <strong>{respondent}!</strong></h2>
          <p>Thank you for completing the Leadership Diagnostic.</p>
          <div className="summary-scores ">
            <div className="summary-box highlight">
              <span>Score:</span>
              <strong>{totalScore}</strong>
            </div>
            <div className="summary-box highlight">
              <span>Weighted Score:</span>
              <strong>{totalWeightedScore}</strong>
            </div>
          </div>
          <p className="redirect">Returning to Welcome Page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <span className="bg-yellow-100 text-yellow-800 px-8 py-2 rounded-full text-lg font-semibold">
            LEAN IN COACHING
          </span>
        </div>
        <h1 className="text-4xl font-bold text-center text-[#001B57]">
          Leadership Reset Diagnostic
        </h1>
        <p className="text-center text-gray-600 mt-3 mb-8 text-lg">
          Reflect on your leadership style during high-stakes decisions.
        </p>

        {/* Application-level summary bar */}
        {/* <div className="summary-bar">
          <div className="summary-chip highlight">
            <span>Answered</span>
            <strong>{answeredCount} / {questions.length}</strong>
          </div>
          <div className="summary-chip highlight">
            <span>Total Score</span>
            <strong>{totalScore}</strong>
          </div>
          <div className="summary-chip highlight">
            <span>Total Weight</span>
            <strong>{questionMetrics.reduce((sum, q) => sum + q.weight, 0)}</strong>
          </div>
          <div className="summary-chip highlight">
            <span>Weighted Score</span>
            <strong>{totalWeightedScore}</strong>
          </div>
        </div> */}

        <div className="grid md:grid-cols-4 gap-4 mb-8">

          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-sm">Answered</p>
            <h3 className="text-2xl font-bold text-[#001B57]">
              {answeredCount}/{questions.length}
            </h3>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-sm">Score</p>
            <h3 className="text-2xl font-bold text-[#001B57]">
              {totalScore}
            </h3>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-sm">Weight</p>
            <h3 className="text-2xl font-bold text-[#001B57]">
              {questionMetrics.reduce((sum, q) => sum + q.weight, 0)}
            </h3>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-sm">Weighted</p>
            <h3 className="text-2xl font-bold text-[#001B57]">
              {totalWeightedScore}
            </h3>
          </div>

        </div>

        <div className="mb-8">

          <label className="block text-[#001B57] font-semibold mb-2">
            Respondent Name
          </label>

          <input
            type="text"
            value={respondent}
            placeholder="Enter respondent name"
            onChange={(e) => setRespondent(e.target.value)}
            className="
                  w-full
                  border
                  border-slate-300
                  rounded-xl
                  px-4
                  py-3
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#001B57]
                "
          />

        </div>

        {loading && <p>Loading questions...</p>}

        {!loading && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-6 ">
            {questionMetrics.map((q) => (

              <div key={q.rowIndex} className="text-[#001B57] font-semibold mb-4">
                <p>  <strong>{q.number}.</strong> {q.question} </p>

                {/* <select value={q.selectedAnswer} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.rowIndex]: e.target.value, }))}  >
                  <option value="">-- Select an answer --</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}> {opt} </option>
                  ))}
                </select> */}

                <select value={q.selectedAnswer} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.rowIndex]: e.target.value, }))
                } className="   w-full    border    border-slate-300    rounded-xl    px-4    py-3    focus:ring-2    focus:ring-[#001B57]  ">
                  <option value="">-- Select an answer --</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}> {opt} </option>
                  ))}

                </select>

                <div className="flex flex-wrap gap-2 mt-4">

                  <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                    Score: {q.score}
                  </span>

                  <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                    Weight: {q.weight}
                  </span>

                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Weighted: {q.weightedScore}
                  </span>

                </div>
              </div>
            ))}
          </div>
        )}

        <button className="
w-full
mt-8
bg-[#001B57]
hover:bg-[#002f8a]
text-white
font-semibold
py-4
rounded-2xl
transition
disabled:opacity-50
" onClick={handleSubmit} disabled={saving}      >
          {saving ? "Saving..." : "Publish Data"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center font-medium ${message.type === "error"
                ? "text-red-600"
                : "text-green-600"
              }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default Diagnostic;
