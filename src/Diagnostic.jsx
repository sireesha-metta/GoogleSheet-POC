// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "./Diagnostic.css";

// const LOCAL_API = "http://localhost:3001";

// const GOOGLE_SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycbytHuWxCiTwSTM-1gbpt2UgWzGXWDhZD-QqllAyC6Tcy_xxrdD--Kk2QBjYGcXbubfY/exec";

// const ROW_TO_QKEY = {
//   6: "q1",
//   7: "q2",
//   8: "q3",
//   9: "q4",
//   12: "q5",
//   13: "q6",
//   14: "q7",
//   15: "q8",
//   18: "q9",
//   19: "q10",
//   20: "q11",
//   21: "q12",
// };

// const QUESTION_ROWS = [6, 7, 8, 9, 12, 13, 14, 15, 18, 19, 20, 21];

// function toNumber(value) {
//   const n = Number(value);
//   return Number.isFinite(n) ? n : 0;
// }

// function Diagnostic() {

//    const navigate = useNavigate();
//   const [questions, setQuestions] = useState([]);
//   const [answers, setAnswers] = useState({});
//   const [respondent, setRespondent] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState(null);
//   const [showSummary, setShowSummary] = useState(false);

//   useEffect(() => {
//     fetch(`${LOCAL_API}/api/questions`)
//       .then((r) => r.json())
//       .then((data) => {
//         setQuestions(data);
//         const initial = {};
//         data.forEach((q) => {
//           if (q.answer) initial[q.rowIndex] = q.answer;
//         });
//         setAnswers(initial);
//         setLoading(false);
//       })
//       .catch(() => {
//         setMessage({
//           type: "error",
//           text: "Could not load questions. Is the server running?",
//         });
//         setLoading(false);
//       });
//   }, []);

//   const answeredCount = questions.filter((q) => (answers[q.rowIndex] || "").trim() !== "").length;

//   const questionMetrics = questions.map((q) => {
//     const selectedAnswer = answers[q.rowIndex] || "";
//     const score = toNumber(q.optionScoreMap?.[selectedAnswer]);
//     const weight = toNumber(q.weight);
//     const weightedScore = score * weight;
//     return {
//       ...q,
//       selectedAnswer,
//       score,
//       weight,
//       weightedScore,
//     };
//   });

//   const totalScore = questionMetrics.reduce((sum, q) => sum + q.score, 0);
//   const totalWeightedScore = questionMetrics.reduce((sum, q) => sum + q.weightedScore, 0);

//   const handleSubmit = async () => {
//     if (Object.keys(answers).length === 0) {
//       setMessage({
//         type: "error",
//         text: "Please select at least one answer before saving.",
//       });
//       return;
//     }

//     setSaving(true);
//     setMessage(null);

//     try {
//       const payload = {
//         respondent: respondent.trim() || "Anonymous",
//         submittedAt: new Date().toISOString(),
//         mode: "template-update",
//         answersByRow: {},
//         answersByQuestion: {},
//         totalScore,
//         totalWeightedScore,
//         questionResponses: [],
//       };

//       QUESTION_ROWS.forEach((rowIdx) => {
//         const qKey = ROW_TO_QKEY[rowIdx];
//         const value = answers[rowIdx] || "";
//         payload[qKey] = value;
//         payload.answersByRow[rowIdx] = value;
//       });

//       questionMetrics.forEach((q) => {
//         payload.answersByQuestion[q.question] = q.selectedAnswer;
//         payload.questionResponses.push({
//           rowIndex: q.rowIndex,
//           number: q.number,
//           question: q.question,
//           answer: q.selectedAnswer,
//           score: q.score,
//           weight: q.weight,
//           weightedScore: q.weightedScore,
//         });
//       });

//       const res = await fetch(GOOGLE_SCRIPT_URL, {
//         method: "POST",
//         body: JSON.stringify(payload),
//       });

//       const text = await res.text();
//       let result;

//       try {
//         result = JSON.parse(text);
//       } catch {
//         const plain = String(text || "").trim().toLowerCase();
//         result = {
//           success: plain === "success" || plain.includes("saved") || plain.includes("updated"),
//           error: text,
//         };
//       }

//       if (result.success) {
//         setMessage({
//           type: "success",
//           text: result.message || "Template updated in column D.",
//         });

//         setShowSummary(true);

//         setTimeout(() => {
//           navigate("/");
//         }, 5000);

//         const latest = await fetch(`${LOCAL_API}/api/questions`).then((r) => r.json());
//         setQuestions(latest);
//       } else {
//         setMessage({ type: "error", text: result.error || "Save failed." });
//       }
//     } catch {
//       setMessage({ type: "error", text: "Network error. Check the Script URL." });
//     } finally {
//       setSaving(false);
//     }
//   };

//   let currentSection = null;

//   if (showSummary) {
//   return (
//     <div style={summaryStyles.page}>
//       <div style={summaryStyles.card}>
//         <div style={summaryStyles.icon}>✓</div>
//         <h2 style={summaryStyles.respondent}> Hello <strong>{respondent} !</strong></h2>

//         <p>
//           <h5>Thank you for completing the Leadership Diagnostic.</h5>
//         </p>

//         <div style={summaryStyles.scoreContainer}>
//           <div style={summaryStyles.scoreBox}>
//             <span>Score:</span><br/>
//             <span><strong>{totalScore}</strong></span>
//           </div>

//           <div style={summaryStyles.scoreBox}>
//             <span>Weight:</span> <br/>
//             <span><strong>{totalWeightedScore}</strong></span>
//           </div>
//         </div>

//         <p style={summaryStyles.redirect}>
//           Returning to Welcome Page...
//         </p>
//       </div>
//     </div>
//   );
// }

//   return (
//     <main style={styles.page}>
//       <section style={styles.shell}>
//         <header style={styles.header}>
//           <h1 style={styles.title}>Leadership Reset Diagnostic</h1>
//           <p style={styles.subtitle}>
//             Complete the form and save. Google Sheets keeps the final formatted template.
//           </p>
//         </header>

//         <div style={styles.topBar}>
//           <div style={styles.fieldGroup}>
//             <label htmlFor="respondent" style={styles.label}>Respondent</label>
//             <input
//               id="respondent"
//               type="text"
//               placeholder="e.g. Jane Smith"
//               value={respondent}
//               onChange={(e) => setRespondent(e.target.value)}
//               style={styles.input}
//             />
//           </div>

//           <div style={styles.counterBox}>
//             <span style={styles.counterLabel}>Progress</span>
//             <strong style={styles.counterValue}>{answeredCount} / {questions.length || 0}</strong>
//           </div>

//           <div style={styles.counterBox}>
//             <span style={styles.counterLabel}>Total Score</span>
//             <strong style={styles.counterValue}>{totalScore}</strong>
//           </div>

//           <div style={styles.counterBox}>
//             <span style={styles.counterLabel}>Weighted Score</span>
//             <strong style={styles.counterValue}>{totalWeightedScore}</strong>
//           </div>
//         </div>

//         {loading && <p style={styles.info}>Loading questions...</p>}

//         {!loading && (
//           <div style={styles.cardsWrap}>
//             {questionMetrics.map((q) => {
//               const showSection = q.section && q.section !== currentSection;
//               if (showSection) currentSection = q.section;

//               return (
//                 <section key={q.rowIndex} style={styles.card}>
//                   {showSection && <h3 style={styles.sectionTitle}>{q.section}</h3>}
//                   <p style={styles.question}>
//                     <span style={styles.qNo}>{q.number}.</span> {q.question}
//                   </p>

//                   <label htmlFor={`answer-${q.rowIndex}`} style={styles.label}>Select answer</label>
//                   <select
//                     id={`answer-${q.rowIndex}`}
//                     value={q.selectedAnswer}
//                     onChange={(e) =>
//                       setAnswers((prev) => ({
//                         ...prev,
//                         [q.rowIndex]: e.target.value,
//                       }))
//                     }
//                     style={styles.select}
//                   >
//                     <option value="">-- Select an answer --</option>
//                     {q.options.map((opt) => (
//                       <option key={opt} value={opt}>
//                         {opt}
//                       </option>
//                     ))}
//                   </select>

//                   <div style={styles.metricRow}>
//                     <span style={styles.metricChip}>Score: {q.score || 0}</span>
//                     <span style={styles.metricChip}>Weight: {q.weight || 0}</span>
//                     <span style={styles.metricChipStrong}>Weighted: {q.weightedScore || 0}</span>
//                   </div>
//                 </section>
//               );
//             })}
//           </div>
//         )}

//         <footer style={styles.footer}>
//           <button onClick={handleSubmit} disabled={saving} style={saving ? styles.btnDisabled : styles.btn}>
//             {saving ? "Saving to Google Sheet..." : "Save to Google Sheet"}
//           </button>
//         </footer>

//         {message && (
//           <p style={message.type === "error" ? styles.error : styles.success}>
//             {message.text}
//           </p>
//         )}
//       </section>
//     </main>
//   );
// }

// const styles = {
//   page: {
//     minHeight: "100vh",
//     margin: 0,
//     background: "linear-gradient(140deg, #f3efe6 0%, #e5edf7 100%)",
//     padding: 20,
//     fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
//   },
//   shell: {
//     maxWidth: 980,
//     margin: "0 auto",
//     background: "#ffffff",
//     borderRadius: 14,
//     boxShadow: "0 16px 36px rgba(31, 45, 63, 0.15)",
//     overflow: "hidden",
//   },
//   header: {
//     padding: "22px 24px 14px",
//     background: "linear-gradient(120deg, #1f2d3f 0%, #294a67 100%)",
//     color: "#f9fbff",
//   },
//   title: {
//     margin: 0,
//     fontSize: 28,
//     fontFamily: "Georgia, 'Times New Roman', serif",
//   },
//   subtitle: {
//     margin: "8px 0 0",
//     fontSize: 14,
//     opacity: 0.92,
//   },
//   topBar: {
//     display: "flex",
//     gap: 16,
//     justifyContent: "space-between",
//     alignItems: "flex-end",
//     padding: "18px 24px",
//     borderBottom: "1px solid #e5e9f2",
//   },
//   fieldGroup: { flex: 1 },
//   label: {
//     display: "block",
//     marginBottom: 6,
//     fontSize: 13,
//     color: "#3b4b61",
//     fontWeight: 600,
//   },
//   input: {
//     width: "100%",
//     maxWidth: 320,
//     padding: "9px 10px",
//     border: "1px solid #c9d3e1",
//     borderRadius: 8,
//     fontSize: 14,
//   },
//   counterBox: {
//     minWidth: 110,
//     textAlign: "right",
//   },
//   counterLabel: {
//     display: "block",
//     fontSize: 12,
//     color: "#667991",
//   },
//   counterValue: {
//     fontSize: 16,
//     color: "#1f2d3f",
//   },
//   cardsWrap: {
//     padding: 24,
//     display: "grid",
//     gap: 14,
//   },
//   card: {
//     background: "#f8fbff",
//     border: "1px solid #dce5f0",
//     borderRadius: 10,
//     padding: 14,
//   },
//   sectionTitle: {
//     margin: "0 0 8px",
//     color: "#244462",
//     fontSize: 15,
//     textTransform: "uppercase",
//     letterSpacing: 0.4,
//   },
//   question: {
//     margin: "0 0 10px",
//     color: "#1c2838",
//     lineHeight: 1.35,
//   },
//   qNo: {
//     fontWeight: 800,
//     color: "#1b5e7a",
//   },
//   select: {
//     width: "100%",
//     maxWidth: 760,
//     padding: "9px 10px",
//     border: "1px solid #c6d3e2",
//     borderRadius: 8,
//     background: "#fff",
//     fontSize: 14,
//   },
//   metricRow: {
//     marginTop: 10,
//     display: "flex",
//     gap: 8,
//     flexWrap: "wrap",
//   },
//   metricChip: {
//     fontSize: 12,
//     color: "#21425f",
//     background: "#e7f0fb",
//     border: "1px solid #c8dbf2",
//     borderRadius: 999,
//     padding: "4px 10px",
//   },
//   metricChipStrong: {
//     fontSize: 12,
//     color: "#1f5f2a",
//     background: "#e8f6eb",
//     border: "1px solid #c7e5cc",
//     borderRadius: 999,
//     padding: "4px 10px",
//     fontWeight: 700,
//   },
//   info: {
//     margin: 0,
//     padding: "18px 24px",
//     color: "#30445d",
//   },
//   footer: {
//     padding: "0 24px 24px",
//     display: "flex",
//     justifyContent: "flex-end",
//   },
//   btn: {
//     padding: "10px 18px",
//     borderRadius: 8,
//     border: "1px solid #2d5475",
//     background: "#295980",
//     color: "#fff",
//     fontWeight: 700,
//     cursor: "pointer",
//   },
//   btnDisabled: {
//     padding: "10px 18px",
//     borderRadius: 8,
//     border: "1px solid #a6b3c0",
//     background: "#b0bbc7",
//     color: "#f8fbff",
//     fontWeight: 700,
//     cursor: "not-allowed",
//   },
//   success: {
//     margin: "0 24px 24px",
//     padding: "10px 12px",
//     borderRadius: 8,
//     background: "#e9f7ee",
//     color: "#23653a",
//     border: "1px solid #b8e1c3",
//   },
//   error: {
//     margin: "0 24px 24px",
//     padding: "10px 12px",
//     borderRadius: 8,
//     background: "#fdeeee",
//     color: "#b32929",
//     border: "1px solid #f4c3c3",
//   },

  
// };
// const summaryStyles = {
//   page: {
//     minHeight: "100vh",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     background:
//       "linear-gradient(135deg,#0f172a,#1e3a8a)",
//   },

//   card: {
//     width: "600px",
//     background: "#fff",
//     borderRadius: "24px",
//     padding: "50px",
//     textAlign: "center",
//     boxShadow: "0 25px 50px rgba(0,0,0,.25)",
//   },

//   icon: {
//     width: "30px",
//     height: "30px",
//     borderRadius: "50%",
//     background: "#22c55e",
//     color: "#fff",
//     fontSize: "12px",
//     margin: "0 auto 5px",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   scoreContainer: {
//     display: "flex",
//     gap: "20px",
//     justifyContent: "center",
//     marginTop: "30px",
//   },

//   scoreBox: {
//     width: "180px",
//     padding: "25px",
//     borderRadius: "16px",
//     background: "#f8fafc",
//     border: "1px solid #e2e8f0",
//   },

//   respondent: {
//     marginTop: "30px",
//     fontSize: "18px",
//   },

//   redirect: {
//     marginTop: "30px",
//     color: "#64748b",
//   },
// };


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

  useEffect(() => {
    fetch(`${LOCAL_API}/api/questions`)
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
        setTimeout(() => navigate("/"), 4000);
      } else {
        setMessage({ type: "error", text: text || "Save failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="diagnostic-page">
      <div className="glass-card fade-in">
        <div className="brand">LEAN IN COACHING</div>
        <h1>Leadership Reset Diagnostic</h1>
        <p className="subtitle">
          Reflect on your leadership style during high-stakes decisions.
        </p>

        {/* Application-level summary */}
        <div className="summary-bar">
          <div className="summary-chip">
            <span>Answered</span>
            <strong>{answeredCount} / {questions.length}</strong>
          </div>
          <div className="summary-chip">
            <span>Total Score</span>
            <strong>{totalScore}</strong>
          </div>
          <div className="summary-chip">
            <span>Total Weight</span>
            <strong>{questionMetrics.reduce((sum, q) => sum + q.weight, 0)}</strong>
          </div>
          <div className="summary-chip highlight">
            <span>Weighted Score</span>
            <strong>{totalWeightedScore}</strong>
          </div>
        </div>

        <div className="respondent-box">
          <label>Respondent</label>
          <input
            type="text"
            placeholder="e.g. Jane Smith"
            value={respondent}
            onChange={(e) => setRespondent(e.target.value)}
          />
        </div>

        {loading && <p>Loading questions...</p>}

        {!loading && (
          <div className="questions-grid">
            {questionMetrics.map((q) => (
              <div key={q.rowIndex} className="question-card">
                <p>
                  <strong>{q.number}.</strong> {q.question}
                </p>
                <select
                  value={q.selectedAnswer}
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

                {/* Per-question metrics */}
                <div className="metric-row">
                  <span className="metric-chip">Score: {q.score}</span>
                  <span className="metric-chip">Weight: {q.weight}</span>
                  <span className="metric-chip strong">
                    Weighted: {q.weightedScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          className="cta-btn"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save to Google Sheet"}
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
