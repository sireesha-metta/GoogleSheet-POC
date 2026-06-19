import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Diagnostic.css";

const LOCAL_API = "http://localhost:3001";
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbytHuWxCiTwSTM-1gbpt2UgWzGXWDhZD-QqllAyC6Tcy_xxrdD--Kk2QBjYGcXbubfY/exec";

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
    fetch(`${LOCAL_API}/api/questions`).then((r) => r.json()) .then((data) => { setQuestions(data);
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

      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const success =
        text.toLowerCase().includes("success") ||
        text.toLowerCase().includes("saved");

      if (success) {
        setMessage({ type: "success", text: "Saved to Google Sheet!" });
        setShowSummary(true);
        setTimeout(() => navigate("/"), 8000);
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
    <div className="diagnostic-page">
      <div className="glass-card fade-in">
        <div className="brand">LEAN IN COACHING</div>
        <h1>Leadership Reset Diagnostic</h1>
        <p className="subtitle">
          Reflect on your leadership style during high-stakes decisions.
        </p>

        {/* Application-level summary bar */}
        <div className="summary-bar">
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
        </div>

        <div className="respondent-box">
          <label>Respondent</label><br />
          <input type="text" placeholder="e.g. Jane Smith" value={respondent}
            onChange={(e) => setRespondent(e.target.value)} />
        </div>

        {loading && <p>Loading questions...</p>}

        {!loading && (
          <div className="questions-grid">
            {questionMetrics.map((q) => (

              <div key={q.rowIndex} className="question-card">
                <p>  <strong>{q.number}.</strong> {q.question} </p>

                <select value={q.selectedAnswer}  onChange={(e) => setAnswers((prev) => ({...prev, [q.rowIndex]: e.target.value,})) }  >
                  <option value="">-- Select an answer --</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}> {opt} </option>
                  ))}
                </select>

                <div className="metric-row">
                  <span className="metric-chip">Score: {q.score}</span>
                  <span className="metric-chip">Weight: {q.weight}</span>
                  <span className="metric-chip strong">Weighted: {q.weightedScore}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="cta-btn" onClick={handleSubmit} disabled={saving}      >
          {saving ? "Saving..." : "Publish Data"}
        </button>

        {message && (
          <p className={message.type === "error" ? "error-msg" : "success-msg"}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default Diagnostic;
