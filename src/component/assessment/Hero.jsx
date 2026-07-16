import {ArrowRight,Clock3,ClipboardCheck,ShieldCheck,} from "lucide-react";

export default function Hero({ onStart }) {
  return (
    // <section className="min-h-screen bg-[#1c1c1c] text-[#c8a85b]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-15">

        <div className="max-w-3xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
            LEAN IN COACHING
          </p>

          <h1 className="text-3xl font-bold leading-tight md:text-3xl">
            Leadership Reset Diagnostic
          </h1>

          {/* <div className="mt-8 h-1 w-28 rounded-full bg-[#cd3cd3]" /> */}

          {/* <p className="mt-10 max-w-2xl text-lg leading-8 text-[#d4d4d4]">
            Discover your leadership strengths, uncover opportunities for
            growth, and receive meaningful insights through a guided
            assessment experience.
          </p> */}
          <p className="mt-6 text-sm text-gray-400">
            One-time assessment • Confidential • Takes approximately 10–15 minutes
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">

            <div className="flex items-center gap-4 rounded-lg border border-[#cd3cd3] px-5 py-4">
              <Clock3 size={22} className="text-[#c8a85b]" />
              <div>
                <p className="font-semibold text-[#c8a85b]">
                  10–15 Minutes
                </p>
                <p className="text-sm text-gray-400">
                  Average completion time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-[#cd3cd3] px-5 py-4">
              <ClipboardCheck size={22} className="text-[#c8a85b]" />
              <div>
                <p className="font-semibold text-[#c8a85b]">
                  12 Questions
                </p>
                <p className="text-sm text-gray-400">
                  Leadership assessment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-[#cd3cd3] px-5 py-4">
              <ShieldCheck size={22} className="text-[#c8a85b]" />
              <div>
                <p className="font-semibold text-[#c8a85b]">
                  Confidential
                </p>
                <p className="text-sm text-gray-400">
                  Your information is protected
                </p>
              </div>
            </div>

          </div>

          <button
            onClick={onStart}
            className="mt-14 inline-flex items-center gap-3 rounded-full border border-[#cd3cd3] bg-[#c8a85b] px-8 py-4 text-lg font-semibold text-[#1c1c1c] transition-all duration-300 hover:opacity-90"
          >
            Begin Assessment
            <ArrowRight size={20} />
          </button>

          

        </div>

      </div>
    // </section>
  );
}