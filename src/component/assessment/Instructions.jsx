export default function Instructions({ onBack, onBegin }) {
  return (
    <section className="min-h-screen bg-[#1c1c1c]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full max-w-4xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">LEAN IN COACHING </p>

          <h1 className="text-3xl font-bold leading-tight text-[#c8a85b] md:text-3xl">Before you begin</h1>

          <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-400">
            Please read the following instructions before starting your
            Leadership Reset Diagnostic.
          </p>

          <div className="mt-8 max-w-3xl rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">

            {/* <p className="mb-6 text-sm font-semibold uppercase tracking-[4px] text-[#cd3cd3]">Step 2 of 3</p> */}

            <div className="space-y-5 text-[#c8a85b]">

              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8a85b] text-[#1c1c1c] font-bold"> ✓ </span>
                <span className="text-lg">
                  Takes approximately <strong>10–15 minutes</strong>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8a85b] text-[#1c1c1c] font-bold"> ✓</span>
                <span className="text-lg">
                  Select <strong>one answer</strong> for each question
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8a85b] text-[#1c1c1c] font-bold">✓</span>
                <span className="text-lg">
                  There are <strong>no right or wrong answers</strong>
                </span>
              </div>

            </div>

            <div className="mt-10 flex justify-between">
              <button  type="button"  onClick={onBack}  className="rounded-full border border-[#cd3cd3] bg-transparent px-8 py-4 font-semibold text-[#c8a85b] transition hover:bg-[#cd3cd3]/10"  >   Previous   </button>

              <button  type="button" onClick={onBegin}   className="rounded-full border border-[#cd3cd3] bg-[#c8a85b] px-8 py-4 font-semibold text-[#1c1c1c] transition hover:opacity-90"   >  Begin Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}