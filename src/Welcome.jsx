import { useNavigate } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="leadership-page">

      <div className="brand">
        LEAN IN COACHING 
      </div>

      <h1>Leadership Reset Diagnostic</h1>

      <p className="subtitle">
        Assess how effectively you lead during high-stakes conversations,
        critical decisions, and moments that require team alignment.
      </p>

      <div className="section">
        <h3>Before You Begin</h3>
        <p>
          Consider each question from your own leadership position and
          reflect on how you interact with your leadership team when
          important decisions need to be made.
        </p>
      </div>

      <div className="steps-container">
        <div className="step-card">
          <span>🧭</span>
          Navigate to the Diagnostic tab
        </div>

        <div className="step-card">
          <span>📖</span>
          Read each question carefully
        </div>

        <div className="step-card">
          <span>✅</span>
          Select your response from the dropdown menu
        </div>

        <div className="step-card">
          <span>🎯</span>
          Review your calculated score
        </div>
      </div>

      <div className="info-box">
        <h4>After Completion</h4>
        <ul>
          <li>Save the completed diagnostic to Google Docs</li>
          <li>Email the completed file to Lorraine@Leanin-Coaching.com</li>
          <li>Your results will be discussed during your next coaching session</li>
        </ul>
      </div>

      <div className="btn-group">
        <button className="begin-btn" onClick={() => navigate("/diagnostic")}>
          Begin Diagnostic
        </button>
        <button className="dashboard-btn" onClick={() => navigate("/dashboard")}>
          View Dashboard
        </button>
      </div>
    </div>
  );
}
