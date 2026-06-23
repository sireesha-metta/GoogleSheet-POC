import { useNavigate } from "react-router-dom";
import AuthHeader from "../component/AuthHeader.jsx";


export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-8">
        <AuthHeader />
        <div className="rounded-[32px] border border-yellow-400/20 bg-slate-950/95 p-8 shadow-[0_35px_120px_-30px_rgba(250,204,21,0.45)] backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-yellow-300/90">Welcome back</p>
              <h1 className="mt-3 text-4xl font-serif font-semibold text-white md:text-5xl">
                Leadership Assessment
              </h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Discover your leadership strengths, identify growth opportunities, and guide your team with confidence.
              </p>
            </div>

          </div>

          {/* <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-yellow-400/15 bg-slate-950/80 p-6 shadow-xl shadow-yellow-500/5 transition hover:border-yellow-300/40">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Assessment</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">Leadership Reset</h3>
              <p className="mt-3 text-slate-400">A concise diagnostic designed to highlight your leadership potential.</p>
            </div>

            <div className="rounded-3xl border border-yellow-400/15 bg-slate-950/80 p-6 shadow-xl shadow-yellow-500/5 transition hover:border-yellow-300/40">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Duration</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">10-15 min</h3>
              <p className="mt-3 text-slate-400">Focused, fast, and relevant for busy leaders.</p>
            </div>

            <div className="rounded-3xl border border-yellow-400/15 bg-slate-950/80 p-6 shadow-xl shadow-yellow-500/5 transition hover:border-yellow-300/40">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Questions</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">20+</h3>
              <p className="mt-3 text-slate-400">Insightful prompts that surface your leadership style.</p>
            </div>
          </div> */}

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { icon: '🧭', title: 'Navigate', description: 'Open the assessment section.' },
              { icon: '📖', title: 'Read', description: 'Review each question carefully.' },
              { icon: '✅', title: 'Respond', description: 'Select the answer that fits best.' },
              { icon: '🎯', title: 'Review', description: 'See your score and next steps.' },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-yellow-400/10 bg-slate-950/85 p-6 shadow-xl shadow-yellow-500/5 transition hover:-translate-y-1 hover:border-yellow-300/40 hover:shadow-yellow-500/15">
                <div className="text-4xl">{item.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-yellow-400/25 bg-slate-950/80 p-8 shadow-xl shadow-yellow-500/10">
            <h2 className="text-2xl font-semibold text-white">After Completion</h2>
            <ul className="mt-5 space-y-3 text-slate-300">
              <li>✓ Save the completed diagnostic to Google Sheets</li>
              <li>✓ Email the completed report to your coach</li>
              <li>✓ Review results during your next session</li>
            </ul>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-yellow-400/15 bg-slate-900/80 p-6 text-center shadow-xl shadow-yellow-500/10">
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-300/80">Your leadership edge</p>
            <p className="max-w-2xl text-base text-slate-300">
              Take the next step with a polished assessment experience designed for emerging and established leaders alike.
            </p>
            <button
              onClick={() => navigate("/diagnostic")}
              className="rounded-full bg-yellow-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
