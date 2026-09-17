import { useState } from "react";

export default function OneWordInput({ onContinue, onBack }) {
  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [word3, setWord3] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const w1 = word1.trim();
    const w2 = word2.trim();
    const w3 = word3.trim();

    if (!w1 || !w2 || !w3) {
      setError("Please provide all 3 single-word answers before continuing.");
      return;
    }

    if (w1.includes(" ") || w2.includes(" ") || w3.includes(" ")) {
      setError("Each answer must be a single word without spaces.");
      return;
    }

    setError("");
    onContinue([w1, w2, w3]);
  };

  return (
    <section className="min-h-screen bg-[#1c1c1c] text-[#c8a85b]">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
            LEAN IN COACHING
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[#c8a85b] md:text-3xl mb-4">
            Additional Data Point: 3 One-Word Answers
          </h1>
          <p className="mb-6 text-base text-gray-300">
            Before submitting your diagnostic, please provide <strong className="text-[#c8a85b]">3 single words</strong> that best describe your current leadership experience.
          </p>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8 shadow-xl">
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#c8a85b] mb-2">
                  Word #1 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Collaborative"
                  value={word1}
                  onChange={(e) => setWord1(e.target.value)}
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-3.5 text-white placeholder-gray-500 focus:border-[#c8a85b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#c8a85b] mb-2">
                  Word #2 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fast-paced"
                  value={word2}
                  onChange={(e) => setWord2(e.target.value)}
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-3.5 text-white placeholder-gray-500 focus:border-[#c8a85b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#c8a85b] mb-2">
                  Word #3 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cautious"
                  value={word3}
                  onChange={(e) => setWord3(e.target.value)}
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-3.5 text-white placeholder-gray-500 focus:border-[#c8a85b] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-[#c8a85b]/40 px-6 py-3 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#c8a85b]/10"
              >
                ← Back to Questions
              </button>

              <button
                type="submit"
                className="rounded-full bg-[#c8a85b] px-8 py-3 text-sm font-bold text-[#1c1c1c] transition hover:bg-[#d8b96b] shadow-lg"
              >
                Continue to Final Step →
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
