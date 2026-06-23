import { useNavigate } from "react-router-dom";
import { getAuthSession } from "../utils/auth";
import Diagnostic from "./Diagnostic.jsx";


export default function Welcome() {
  const user = getAuthSession();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-yellow-400">
      <div className="min-h-screen bg-amber-300 max-w-6xl mx-auto px-6 py-8">

        <div className="bg-blue-400 rounded-xl shadow-lg p-6 mb-6">
          <span className="flex justify-center items-center text-[#001B57] px-8 py-2  text-3xl font-semibold w-fit mx-auto">
            Leadership Assessment Platform
          </span>

          <h2 className="text-2xl font-bold text-[#001B57] mt-4">
            Welcome Back, {user?.name || "Leader"}
          </h2>

          <p className="text-black-600 text-lg mt-4 max-w-3xl">
            Discover your leadership strengths, identify growth opportunities,
            and improve your ability to guide teams through high-impact decisions.
          </p>

          <button onClick={() => navigate("/diagnostic")}
            className="mt-8 bg-[#001B57] hover:bg-[#002c91] text-white px-8 py-2 rounded-xl font-semibold transition"  >
            Start Assessment
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-400 rounded-2xl shadow-md p-6">
            <p className="text-gray-700 text-sm uppercase">Assessment</p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">Leadership Reset </h3>
          </div>

          <div className="bg-blue-400 rounded-2xl shadow-md p-6">
            <p className="text-gray-700 text-sm uppercase">Duration</p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">10-15 Min</h3>
          </div>

          <div className="bg-blue-400 rounded-2xl shadow-md p-6">
            <p className="text-gray-700 text-sm uppercase"> Questions </p>
            <h3 className="text-2xl font-bold text-[#001B57] mt-2">20+ </h3>
          </div>
        </div>

        {/* <h2 className="text-3xl font-bold text-[#001B57] mb-6">
          Assessment Journey
        </h2> */}

        <div className="grid md:grid-cols-4 gap-6">

          <div className="bg-blue-400 rounded-2xl p-4 shadow-md hover:shadow-xl transition">
            <div className="text-4xl mb-4">🧭</div>
            <h3 className="font-bold text-lg">Navigate</h3>
            <p className="text-gray-900 mt-2"> Open the assessment section.</p>
          </div>

          <div className="bg-blue-400 rounded-2xl p-4 shadow-md hover:shadow-xl transition">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="font-bold text-lg">Read</h3>
            <p className="text-gray-900 mt-2">Review every question carefully.</p>
          </div>

          <div className="bg-blue-400 rounded-2xl p-4 shadow-md hover:shadow-xl transition">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="font-bold text-lg">Respond</h3>
            <p className="text-gray-900 mt-2">Select the best response.</p>
          </div>

          <div className="bg-blue-400 rounded-2xl p-4 shadow-md hover:shadow-xl transition">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-bold text-lg">Review</h3>
            <p className="text-gray-900 mt-2"> View your assessment score. </p>
          </div>

        </div>

        <div className="mt-10 bg-blue-400 rounded-2xl shadow-md p-8 border-l-4 border-yellow-500 text-center">

          <h2 className="text-2xl font-bold text-[#001B57] mb-4">
            After Completion
          </h2>

          <ul className="space-y-3 text-gray-900">
            <li>✓ Save the completed diagnostic to Google Sheets</li>
            <li>✓ Email the completed report to Lorraine</li>
            <li>✓ Review results during the next coaching session</li>
          </ul>

        </div>

      </div>
    </div>
  );
}
