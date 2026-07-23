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
    return 0;
  }, [initialAnswers, questions]);

  const [index, setIndex] = useState(computeStartIndex);
  const [answers, setAnswers] = useState(initialAnswers || {});

  const currentQuestion = questions[index] || {};
  const currentQuestionText = String(currentQuestion?.question || "");
  const currentOptions = Array.isArray(currentQuestion?.options) && currentQuestion.options.length ? currentQuestion.options : [];
  const answerKey = Number.isFinite(Number(currentQuestion?.rowIndex)) ? Number(currentQuestion.rowIndex) : index;
  const currentAnswer = answers[answerKey] || "";
  
  const answeredCount = useMemo(
    () => Object.values(answers || {}).filter((value) => String(value || "").trim()).length,
    [answers]
  );

  const progress = useMemo(
    () => Math.round((answeredCount / questions.length) * 100),
    [answeredCount, questions.length]
  );


  const setAnswer = (answer) => {
    setAnswers((prev) => ({ ...prev, [answerKey]: answer }));
  };

  useEffect(() => {
    // Keep the local question index aligned with the latest answer snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(initialAnswers || {});
    setIndex(computeStartIndex());
  }, [initialAnswers, computeStartIndex]);

  const handleNext = async () => {
    if (!currentAnswer) return;

    if (index === questions.length - 1) {
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
    setIndex((prev) => prev + 1);
  };

  return (
    <section className="min-h-screen bg-[#1c1c1c]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">LEAN IN COACHING</p>
          <h1 className="text-3xl font-bold leading-tight text-[#c8a85b] md:text-3xl">Leadership Reset Diagnostic</h1>
          <p className="mt-3 text-lg text-gray-400">Question {index + 1} of {questions.length}</p>
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
              {index + 1}.{currentQuestionText}
            </h2>



            {/* Options */}
            <div className="space-y-3" role="radiogroup" aria-label="Question Choices" >
              {currentOptions.length === 0 ? (
                <p className="rounded-md border border-yellow-400 bg-yellow-900/5 p-3 text-sm text-yellow-300">
                  No choices configured for this question. Please contact the administrator.
                </p>
              ) : (
                currentOptions.map((choice) => (
                  <label key={choice} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${currentAnswer === choice
                    ? "border-[#c8a85b] bg-[#313131]"
                    : "border-[#3a3a3a] bg-[#1f1f1f] hover:border-[#c8a85b]"
                    }`} >
                    <input type="radio" name={`question-${answerKey}`} value={choice} checked={currentAnswer === choice}
                      onChange={() => setAnswer(choice)} className="h-3 w-3 accent-[#c8a85b]" />

                    <span className="text-lg text-[#c8a85b]">{choice} </span>
                  </label>
                ))
              )}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-between">
              <button type="button" className="rounded-full border border-[#cd3cd3] bg-transparent px-6 py-3 font-semibold text-[#c8a85b] transition hover:bg-[#cd3cd3]/10"
                onClick={() => {
                  if (index === 0) {
                    onBack();
                    return;
                  }
                  setIndex((prev) => prev - 1);
                }} > Previous
              </button>

              <button type="button" onClick={handleNext} disabled={!currentAnswer} className="rounded-full border border-[#cd3cd3] bg-[#c8a85b] px-6 py-3 font-semibold text-[#1c1c1c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" >
                {index === questions.length - 1 ? "Finish Assessment" : "Next Question"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}