import { useNavigate } from "react-router-dom";
import AuthHeader from "../component/AuthHeader.jsx";


export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1E293B]" />
      <div className=" sticky top-0 z-50 text-black">
        <AuthHeader />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mt-3 text-4xl font-serif font-semibold text-white md:text-5xl">Leadership Assessment </h1>
            <p className="mt-4 max-w-2xl text-slate-300">Discover your leadership strengths, identify growth opportunities, and guide your team with confidence.</p>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: '🧭', title: 'Navigate', description: 'Open the assessment section.' },
            { icon: '📖', title: 'Read', description: 'Review each question carefully.' },
            { icon: '✅', title: 'Respond', description: 'Select the answer that fits best.' },
            { icon: '🎯', title: 'Review', description: 'See your score and next steps.' },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/20 bg-slate-950/85 p-6 shadow-xl shadow-yellow-500/5 transition hover:-translate-y-1 hover:border-yellow-300/40 hover:shadow-yellow-500/15">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-yellow-400/25 bg-slate-950/80 p-8 shadow-xl shadow-yellow-500/10">
          <h2 className="text-2xl font-semibold text-white">After Completion</h2>
          <ul className="mt-5 space-y-3 text-slate-300">
            <li>✓ Once assessment has been submitted, it will automatically update in Google-Sheet.</li>
            <li>✓ Responses have been securely recorded and synchronized with the assessment system.</li>
            <li>✓ Lorraine will review your results with you during your next coaching session.</li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-yellow-400/15 bg-slate-900/80 p-6 text-center shadow-xl shadow-yellow-500/10">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-300/80">Your leadership edge</p>
          <p className="max-w-2xl text-base text-slate-300">Take the next step with a polished assessment experience designed for emerging and established leaders alike.
          </p>
          <button onClick={() => navigate("/diagnostic")} className="rounded-full bg-yellow-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400"> Start Assessment  </button>
        </div>
      </div>
    </div>
  );
}
