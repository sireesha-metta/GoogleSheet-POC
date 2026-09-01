import { useMemo, useState, useEffect, useCallback } from "react";
export default function QuestionsCard({ questions, initialAnswers, draftNotice, onBack, onNextAutoSave, onFinish, }) {

  const computeStartIndex = useCallback(() => {
    const ans = initialAnswers || {};
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const key = Number.isFinite(Number(q?.rowIndex)) ? Number(q.rowIndex) : i;
      if (!ans || !ans[key]) {
        return i;
      }
    }
    return Math.max(0, questions.length - 1);
  }, [initialAnswers, questions]);

  const [index, setIndex] = useState(computeStartIndex);
  const [answers, setAnswers] = useState(initialAnswers || {});

  const safeIndex = Math.min(Math.max(0, index), questions.length - 1);
  const currentQuestion = questions[safeIndex] || {};
  const currentQuestionText = String(currentQuestion?.question || "");
  const currentOptions = Array.isArray(currentQuestion?.options) && currentQuestion.options.length ? currentQuestion.options : [];
  const answerKey = Number.isFinite(Number(currentQuestion?.rowIndex)) ? Number(currentQuestion.rowIndex) : safeIndex;
  const currentAnswer = answers[answerKey] || "";
  
  const answeredCount = useMemo(
    () => Object.values(answers || {}).filter((value) => String(value || "").trim()).length,
    [answers]
  );

  const progress = useMemo(
    () => Math.round((safeIndex / questions.length) * 100),
    [safeIndex, questions.length]
  );
  
  const handleSelectOption = async (choice) => {
    const updatedAnswers = { ...answers, [answerKey]: choice };
    setAnswers(updatedAnswers);

    const nextIndex = safeIndex + 1;
    if (nextIndex >= questions.length) {
      if (onNextAutoSave) {
        try {
          await onNextAutoSave(updatedAnswers);
        } catch (e) {}
      }
      onFinish(updatedAnswers);
      return;
    }

    setIndex(nextIndex);

    if (onNextAutoSave) {
      try {
        await onNextAutoSave(updatedAnswers);
      } catch (e) {
        console.error("Auto-save draft error:", e);
      }
    }
  };

  const handleNext = async () => {
    if (!currentAnswer) return;

    if (safeIndex >= questions.length - 1) {
      onFinish(answers);
      return;
    }

    if (onNextAutoSave) {
      try {
        await onNextAutoSave(answers);
      } catch {
        return;
      }
    }
    setIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handleBack = () => {
    if (index === 0) {
      onBack();
    } else {
      setIndex((prev) => prev - 1);
    }
  };

  return (
    <section className="min-h-screen bg-[#1c1c1c]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full max-w-4xl">
          
          <p className="mb-2 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">LEAN IN COACHING</p>
          <h1 className="text-3xl font-bold leading-tight text-[#c8a85b] md:text-3xl mb-6">Leadership Reset Diagnostic</h1>

          <div className="relative flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-base font-semibold text-[#c8a85b] transition hover:text-white"
            >
              ← Back
            </button>
            <p className="text-lg font-semibold text-gray-300 absolute left-1/2 -translate-x-1/2">
              Question {safeIndex + 1} of {questions.length}
            </p>
            <div />
          </div>
          <div className="mt-6 rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">
            <div className="mb-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
                <div className="h-full bg-[#c8a85b] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {progress}% Complete
              </p>

              {draftNotice ? (
                <div className="mb-3 rounded-lg  px-3 py-2 text-sm text-[#c8a85b]">
                  {draftNotice}
                </div>
              ) : null}
            </div>

            {/* Question */}
            <h2 className="mb-3 text-xl font-semibold leading-9 text-[#c8a85b]">
              {safeIndex + 1}.{currentQuestionText}
            </h2>



            {/* Options */}
            <div className="space-y-3" role="radiogroup" aria-label="Question Choices" >
              {currentOptions.length === 0 ? (
                <p className="rounded-md border border-yellow-400 bg-yellow-900/5 p-3 text-sm text-yellow-300">
                  No choices configured for this question. Please contact the administrator.
                </p>
              ) : (
                currentOptions.map((choice) => (
                  <label
                    key={choice}
                    onClick={() => handleSelectOption(choice)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${currentAnswer === choice
                      ? "border-[#c8a85b] bg-[#313131]"
                      : "border-[#3a3a3a] bg-[#1f1f1f] hover:border-[#c8a85b]"
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question-${answerKey}`}
                      value={choice}
                      checked={currentAnswer === choice}
                      readOnly
                      className="h-3 w-3 accent-[#c8a85b]"
                    />

                    <span className="text-lg text-[#c8a85b]">{choice} </span>
                  </label>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}