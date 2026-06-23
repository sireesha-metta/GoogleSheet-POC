import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, submitDiagnostic } from "../utils/auth";

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
      <div className="min-h-screen bg-gradient-to-br from-amber-200 to-yellow-400">
        <div className="min-h-screen bg-amber-300 max-w-6xl mx-auto px-6 py-8 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-blue-400 rounded-3xl shadow-xl p-8 text-center">

            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center shadow-lg">
                <span className="text-4xl">✓</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#001B57] mb-2">
              Hello <span className="text-yellow-700">{respondent}!</span>
            </h2>

            <p className="text-gray-700 text-lg mb-8">
              Thank you for completing the Leadership Diagnostic.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">

              <div className="bg-blue-50 rounded-2xl p-6 shadow-md">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Total Score</p>

                <h3 className="text-4xl font-bold text-[#001B57]">{totalScore} </h3>
              </div>

              <div className="bg-yellow-50 rounded-2xl p-6 shadow-md">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Weighted Score </p>

                <h3 className="text-4xl font-bold text-yellow-700">{totalWeightedScore} </h3>
              </div>

            </div>

            <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-5 mb-6">
              <p className="text-green-800 font-semibold text-lg"> ✓ Data saved successfully! </p>
              <p className="text-green-700 text-sm mt-2"> Redirecting to Welcome Page in 5 seconds...</p>
            </div>

          </div>
        </div>
      </div>
    )}

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-yellow-400">
      <div className="min-h-screen bg-amber-300 max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-center mb-6">
          <span className="bg-yellow-100 text-yellow-800 px-8 py-2 rounded-full text-lg font-semibold">
            LEAN IN COACHING
          </span>
        </div>
        <h1 className="text-4xl font-bold text-center text-[#001B57]">
          Leadership Reset Diagnostic
        </h1>
        <p className="text-center text-gray-700 mt-3 mb-8 text-lg">
          Reflect on your leadership style during high-stakes decisions.
        </p>

        <div className="grid md:grid-cols-4 gap-4 mb-8">

          <div className="bg-blue-400 rounded-2xl p-4 text-center shadow-md">
            <p className="text-gray-700 text-sm font-semibold">Answered</p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">
              {answeredCount}/{questions.length}
            </h3>
          </div>

          <div className="bg-blue-400 rounded-2xl p-4 text-center shadow-md">
            <p className="text-gray-700 text-sm font-semibold">Score</p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">
              {totalScore}
            </h3>
          </div>

          <div className="bg-blue-400 rounded-2xl p-4 text-center shadow-md">
            <p className="text-gray-700 text-sm font-semibold">Weight</p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">
              {questionMetrics.reduce((sum, q) => sum + q.weight, 0)}
            </h3>
          </div>

          <div className="bg-blue-400 rounded-2xl p-4 text-center shadow-md">
            <p className="text-gray-700 text-sm font-semibold">Weighted</p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">
              {totalWeightedScore}
            </h3>
          </div>

        </div>

        <div className="bg-blue-400 rounded-2xl shadow-md p-6 mb-8">

          <label className="block text-[#001B57] font-semibold mb-3 text-lg">
            Respondent Name
          </label>

          <input type="text" value={respondent} placeholder="Enter respondent name" onChange={(e) => setRespondent(e.target.value)}
            className=" w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#001B57] text-gray-800"  />

        </div>

        {loading && <p className="text-center text-[#001B57] font-semibold py-8">Loading questions...</p>}

        {!loading && (
          <div className="bg-blue-400 rounded-2xl shadow-md hover:shadow-lg transition p-6 mb-8">
            {questionMetrics.map((q) => (

              <div key={q.rowIndex} className="text-[#001B57] font-semibold mb-6 pb-6 border-b border-blue-300 last:border-0 last:pb-0 last:mb-0">
                <p className="mb-3"><strong>{q.number}.</strong> {q.question} </p>

                <select value={q.selectedAnswer} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.rowIndex]: e.target.value, }))} 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#001B57] text-gray-800 bg-white">
                  <option value="">-- Select an answer --</option>
                  {q.options.map((opt) => ( <option key={opt} value={opt}> {opt} </option> ))}
                </select>

                <div className="flex flex-wrap gap-2 mt-4">

                  <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                    Score: {q.score}
                  </span>

                  <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                    Weight: {q.weight}
                  </span>

                  <span className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                    Weighted: {q.weightedScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-8">
          <button onClick={handleLoadDraft}  disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-2xl 
            transition shadow-md hover:shadow-lg disabled:opacity-50" >
            Load Draft
          </button>

          <button
            onClick={handleSaveDraft}  disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl 
            transition shadow-md hover:shadow-lg disabled:opacity-50">
            Save Draft
          </button>

          <button onClick={handleSubmit}  disabled={saving}
            className="bg-[#001B57] hover:bg-[#002c91] text-white font-semibold py-4 rounded-2xl 
            transition disabled:opacity-50 shadow-lg hover:shadow-xl"  >
            {saving ? "Publishing..." : "Publish Data"}
          </button>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center font-medium ${message.type === "error"
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-green-100 text-green-800 border border-green-300" }`}  >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Diagnostic;
