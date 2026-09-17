import { useState } from "react";

export default function DiagnosticHub({ profile, onSelectDiagnostic, onBack }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const diagnostics = [
    {
      id: "leadership-reset",
      title: "1. Leadership Reset",
      status: "IN PROGRESS",
      badgeColor: "bg-[#c8a85b] text-[#1c1c1c]",
      borderColor: "border-[#c8a85b]",
      target: "Senior Leaders, Directors, CTO, CIO, COO, CEO, CIAO, CFO",
      isLocked: false,
      description: "Evaluate team decision-making, conversation patterns, and leader signals.",
      cta: "Start Assessment →",
    },
    {
      id: "diversity-of-thought",
      title: "2. Diversity of Thought",
      status: "2ND TO DEVELOP",
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      borderColor: "border-gray-700/60",
      target: "Senior Leaders, Directors, CTO, CIO, COO, CEO, CIAO, CFO",
      isLocked: true,
      description: "Assess cognitive diversity, perspective sharing, and groupthink risks.",
      tooltip: "Coming Soon in Phase 2 — Will be unlocked following the Go-Live of Leadership Reset.",
    },
    {
      id: "leadership-team-showing-up",
      title: "3. Leadership Team Showing Up",
      status: "3RD TO DEVELOP",
      badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      borderColor: "border-gray-700/60",
      target: "Members of Leadership Team",
      isLocked: true,
      description: "Measure team execution, accountability, and collective presence.",
      tooltip: "Coming Soon in Phase 3 — Designed specifically for Leadership Team members.",
    },
  ];

  return (
    <section className="min-h-screen bg-[#1c1c1c] text-[#c8a85b]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
                LEAN IN COACHING
              </p>
              <h1 className="text-3xl font-bold text-[#c8a85b] md:text-4xl">
                Diagnostic Hub
              </h1>
              <p className="mt-2 text-base text-gray-300">
                Welcome, <span className="font-semibold text-[#c8a85b]">{profile?.firstName} {profile?.lastName}</span>. Select an available diagnostic to begin.
              </p>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-[#c8a85b]/40 px-5 py-2.5 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#c8a85b]/10 hover:text-white"
            >
              ← Back to Details
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {diagnostics.map((diag) => (
              <div
                key={diag.id}
                onMouseEnter={() => setHoveredCard(diag.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative flex flex-col justify-between rounded-2xl border ${diag.borderColor} bg-[#262626] p-6 shadow-xl transition-all duration-300 ${
                  diag.isLocked
                    ? "opacity-75 hover:opacity-90"
                    : "hover:scale-[1.02] hover:border-[#cd3cd3] hover:shadow-2xl"
                }`}
              >
                <div>
                  {/* Top Badge & Status */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${diag.badgeColor}`}>
                      {diag.status}
                    </span>
                    {diag.isLocked && (
                      <span className="flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-400">
                        🔒 Locked
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white mb-2">
                    {diag.title}
                  </h2>

                  {/* Description */}
                  <p className="mb-4 text-sm leading-relaxed text-gray-300">
                    {diag.description}
                  </p>

                  {/* Target Audience */}
                  <div className="mb-6 rounded-lg bg-[#1c1c1c] p-3 text-xs text-gray-400">
                    <span className="font-semibold text-[#c8a85b]">Target Audience: </span>
                    {diag.target}
                  </div>
                </div>

                {/* CTA or Locked State */}
                <div>
                  {!diag.isLocked ? (
                    <button
                      type="button"
                      onClick={() => onSelectDiagnostic(diag.id)}
                      className="w-full rounded-xl bg-[#c8a85b] py-3 text-center text-sm font-bold text-[#1c1c1c] shadow-lg transition hover:bg-[#d8b96b] hover:shadow-amber-500/20"
                    >
                      {diag.cta}
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-gray-700 bg-gray-800/60 py-3 text-center text-sm font-semibold text-gray-500"
                      >
                        🔒 Unavailable
                      </button>

                      {/* Tooltip on Hover */}
                      {hoveredCard === diag.id && (
                        <div className="absolute bottom-full left-1/2 z-20 mb-3 w-64 -translate-x-1/2 rounded-xl border border-[#cd3cd3] bg-[#1c1c1c] p-3.5 text-xs text-gray-200 shadow-2xl transition-all">
                          <div className="font-semibold text-[#c8a85b] mb-1 flex items-center gap-1.5">
                            💡 Phase Roadmap Info
                          </div>
                          {diag.tooltip}
                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#cd3cd3]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
