import { useNavigate } from "react-router-dom";
import "./Welcome.css";
import { getAuthSession, logoutUser } from "../utils/auth";


export default function Welcome() {
  const user = getAuthSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

 return (
  <div className="min-h-screen bg-slate-100">

    {/* Header */}
    <header className="bg-[#001B57] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <div className="text-white text-2xl font-bold">
          LEAN IN COACHING
        </div>

        <nav className="flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-yellow-300 transition"
          >
            Welcome
          </button>

          <button
            onClick={() => navigate("/diagnostic")}
            className="text-white hover:text-yellow-300 transition"
          >
            Diagnostic
          </button>

          {user?.role === "ADMIN" && (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-white hover:text-yellow-300 transition"
            >
              Dashboard
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-white font-medium">
            {user?.name}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

      </div>
    </header>

    {/* Main Content */}
    <div className="max-w-6xl mx-auto px-6 py-10">

      <div className="bg-white rounded-2xl shadow-xl p-10">

        <h1 className="text-4xl font-bold text-[#001B57] mb-4">
          Leadership Reset Diagnostic
        </h1>

        <p className="text-gray-600 text-lg">
          Assess how effectively you lead during high-stakes conversations,
          critical decisions, and moments that require team alignment.
        </p>

        {/* Before You Begin */}
        <div className="mt-8 bg-blue-50 border-l-4 border-[#001B57] p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-[#001B57] mb-2">
            Before You Begin
          </h3>

          <p className="text-gray-700">
            Consider each question from your own leadership position and
            reflect on how you interact with your leadership team when
            important decisions need to be made.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">

          <div className="bg-slate-50 rounded-xl shadow p-6 text-center">
            <div className="text-5xl mb-3">🧭</div>
            <h4 className="font-semibold">Navigate</h4>
            <p className="text-sm text-gray-600 mt-2">
              Open the Diagnostic section.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl shadow p-6 text-center">
            <div className="text-5xl mb-3">📖</div>
            <h4 className="font-semibold">Read</h4>
            <p className="text-sm text-gray-600 mt-2">
              Review every question carefully.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl shadow p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h4 className="font-semibold">Respond</h4>
            <p className="text-sm text-gray-600 mt-2">
              Select your response from the dropdown menu.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl shadow p-6 text-center">
            <div className="text-5xl mb-3">🎯</div>
            <h4 className="font-semibold">Review</h4>
            <p className="text-sm text-gray-600 mt-2">
              Review your calculated score.
            </p>
          </div>

        </div>

        {/* Info Box */}
        <div className="mt-10 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">

          <h4 className="font-bold text-lg text-[#001B57] mb-3">
            After Completion
          </h4>

          <ul className="space-y-2 text-gray-700">
            <li>• Save the completed diagnostic to Google Sheets</li>
            <li>• Email the completed file to Lorraine</li>
            <li>• Discuss results during the next coaching session</li>
          </ul>

        </div>

        {/* Buttons */}
        {/* <div className="flex flex-wrap gap-4 mt-10">

          <button onClick={() => navigate("/diagnostic")}
            className="bg-[#001B57] hover:bg-[#002f8a] text-white px-6 py-3 rounded-lg font-medium transition"
          > Begin Diagnostic  </button>

          {user?.role === "ADMIN" && (
            <button  onClick={() => navigate("/dashboard")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
            > View Dashboard </button>
          )}

        </div> */}

      </div>

    </div>

  </div>
);
}
