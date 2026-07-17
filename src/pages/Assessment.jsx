import { useEffect, useState } from "react";

import Hero from "../component/assessment/Hero";
import UserDetails from "../component/assessment/UserDetails";
import Instructions from "../component/assessment/Instructions";
import QuestionsCard from "../component/assessment/QuestionsCard";
import ThankYou from "../component/assessment/ThankYou";
import { getQuestions, isAuthenticated, saveAssessmentRespondent, saveDiagnosticDraft, submitPublicAssessment, savePublicDraft, loadPublicDraft,deletePublicDraft } from "../utils/auth";
const COMPLETED_ASSESSMENT_STORAGE_KEY = "leadership_assessment_completed";
const EMPTY_PROFILE = { firstName: "", lastName: "", email: "", mobile: "", id: null };

const normalizeAssessmentLookupKey = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "anonymous";
};

const readCompletedAssessments = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(COMPLETED_ASSESSMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCompletedAssessments = (entries) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(COMPLETED_ASSESSMENT_STORAGE_KEY, JSON.stringify(entries));
};

const persistCompletedAssessment = (entry) => {
  const key = normalizeAssessmentLookupKey(entry?.email || `${entry?.firstName || ""}${entry?.lastName || ""}`);
  const entries = readCompletedAssessments();
  entries[key] = entry;
  writeCompletedAssessments(entries);
};

const getCompletedAssessment = (value) => {
  const key = normalizeAssessmentLookupKey(value);
  const entries = readCompletedAssessments();
  return entries[key] || null;
};

const getLatestCompletedAssessment = () => {
  const entries = Object.values(readCompletedAssessments());
  return entries.length ? entries[entries.length - 1] : null;
};

export default function Assessment() {
  const [step, setStep] = useState("hero");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [assessmentSessionKey, setAssessmentSessionKey] = useState(0);
  const [responses, setResponses] = useState({});
  const [questionItems, setQuestionItems] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [draftInfo, setDraftInfo] = useState("");
  const [draftError, setDraftError] = useState("");
  const [draftSaving, setDraftSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [completedAssessment, setCompletedAssessment] = useState(null);
  const [emailInfo, setEmailInfo] = useState(null);

  const resetAssessmentSession = () => {
    setResponses({});
    setDraftInfo("");
    setDraftError("");
    setSubmitError("");
    setEmailInfo(null);
    setCompletedAssessment(null);
  };

  const returnToHeroWithFreshDetails = () => {
    resetAssessmentSession();
    setDetailsError("");
    setProfile(EMPTY_PROFILE);
    setAssessmentSessionKey((current) => current + 1);
    setStep("hero");
  };

  const loadQuestions = async (activeRef) => {
    setQuestionsLoading(true);
    const result = await getQuestions();

    if (activeRef && !activeRef.current) return;

    if (result.success && Array.isArray(result.data) && result.data.length) {
      const normalized = result.data
        .filter((item) => String(item?.question || "").trim())
        .map((item, index) => {
          if (!Array.isArray(item.options) || item.options.length === 0) {
            throw new Error(`Question ${index + 1} has no options.`);
          }
          return {
            rowIndex: Number(item?.rowIndex) || index,
            number: item?.number,
            section: item?.section || null,
            question: String(item.question),
            options: item.options,
            optionScoreMap: item.optionScoreMap || {},
            weight: item.weight,
          };
        });

      if (normalized.length) {
        setQuestionItems(normalized);
        setQuestionsError("");
      } else {
        setQuestionItems([]);
        setQuestionsError("Question file is empty. Please check the leadership-assessment question file.");
      }
    } else {
      setQuestionItems([]);
      setQuestionsError("Could not load the question file from backend. Please start backend and verify file path.");
    }
    setQuestionsLoading(false);
  };

  useEffect(() => {
    const activeRef = { current: true };
    loadQuestions(activeRef);

    const existingCompleted = getLatestCompletedAssessment();
    if (existingCompleted) {
      setProfile(existingCompleted);
      setCompletedAssessment(existingCompleted);
      setStep("thankyou");
    }

    return () => {
      activeRef.current = false;
    };
  }, []);

  const handleDetailsContinue = async (details) => {
    setDetailsError("");
    resetAssessmentSession();
    setDetailsSaving(true);

    const normalizedEmail = String(details?.email || "").trim().toLowerCase();
    const existingCompleted = getCompletedAssessment(normalizedEmail || `${details?.firstName || ""}${details?.lastName || ""}`);

    if (existingCompleted) {
      setProfile({ ...details, ...existingCompleted });
      setResponses(existingCompleted.answers || {});
      setCompletedAssessment(existingCompleted);
      setStep("thankyou");
      setDetailsSaving(false);
      return;
    }

    const result = await saveAssessmentRespondent({
      firstName: String(details?.firstName || "").trim(),
      lastName: String(details?.lastName || "").trim(),
      email: String(details?.email || "").trim(),
      mobile: String(details?.mobile || "").trim(),
    });

    if (result?.alreadySubmitted) {
      const completedEntry = {
        firstName: String(details?.firstName || "").trim(),
        lastName: String(details?.lastName || "").trim(),
        email: String(details?.email || "").trim(),
        mobile: String(details?.mobile || "").trim(),
        completedAt: new Date().toISOString(),
        responseCount: Number(existingCompleted?.responseCount || 0),
        answers: existingCompleted?.answers || {},
      };

      persistCompletedAssessment(completedEntry);
      setProfile(completedEntry);
      setCompletedAssessment(completedEntry);
      setStep("thankyou");
      setDetailsSaving(false);
      return;
    }

    if (!result.success) {
      setDetailsError(result.message || "Unable to save respondent details.");
      setDetailsSaving(false);
      return;
    }

    // Merge returned respondent id (for public drafts/submissions) into profile
    const returned = result.data || {};
    const respondentId = returned.id || (returned?.data && returned.data.id) || null;
    setProfile({ ...details, id: respondentId });
    setResponses({});
    setAssessmentSessionKey((current) => current + 1);

    // attempt to load any public draft for this respondent so we can resume
    if (!isAuthenticated() && Number.isFinite(Number(respondentId)) && Number(respondentId) > 0) {
      try {
        const draftRes = await loadPublicDraft(respondentId);
        if (draftRes.success && draftRes.data) {
          const draftData = draftRes.data || {};
          setResponses(draftData.answersByRow || {});
          setDraftInfo(`Resume saved progress — ${Number(draftData.answeredCount || 0)}/${Number(draftData.totalQuestions || 0)} answered.`);
        }
      } catch (e) {
        // ignore draft load errors — user can still proceed
      }
    }

    setStep("instructions");
    setDetailsSaving(false);
  };

  const buildAssessmentMetrics = (answers) => {
    const responseMap = {};
    const questionResponses = questionItems.map((item) => {
      const answerKey = Number.isFinite(Number(item?.rowIndex)) ? Number(item.rowIndex) : null;
      const answer = answerKey !== null ? String(answers?.[answerKey] || "") : "";
      responseMap[String(item?.rowIndex ?? "")] = answer;

      const optionScoreMap = item?.optionScoreMap || {};
      const rawScore = optionScoreMap?.[answer];
      const score = Number.isFinite(Number(rawScore)) ? Number(rawScore) : 0;
      const weight = Number.isFinite(Number(item?.weight)) ? Number(item.weight) : 0;

      return {
        rowIndex: item?.rowIndex,
        number: item?.number,
        section: item?.section || null,
        question: String(item?.question || ""),
        answer,
        score,
        weight,
        weightedScore: score * weight,
      };
    });

    const totalScore = questionResponses.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const totalWeightedScore = questionResponses.reduce((sum, item) => sum + Number(item.weightedScore || 0), 0);
    const answeredCount = questionResponses.filter((item) => String(item.answer || "").trim()).length;

    return { responseMap, questionResponses, totalScore, totalWeightedScore, answeredCount };
  };

  const handleSaveDraft = async (answers, options = {}) => {
    const { silent = false } = options;

    if (!silent) {
      setDraftInfo("");
      setDraftError("");
    }

    if (!isAuthenticated()) {
      // For public users, save to public draft endpoint if we have a respondent id
      if (!profile?.id) {
        if (!silent) {
          setDraftError("Login is required to save draft in assessment_drafts.");
        }
        return;
      }
    }

    const { responseMap, questionResponses, totalScore, totalWeightedScore, answeredCount } = buildAssessmentMetrics(answers);

    // if (!silent) {
    //   setDraftSaving(true);
    // }

    const payload = {
      respondent: `${String(profile?.firstName || "").trim()} ${String(profile?.lastName || "").trim()}`.trim() || "Anonymous",
      savedAt: new Date().toISOString(),
      answeredCount,
      totalQuestions: questionItems.length,
      totalScore,
      totalWeightedScore,
      answersByRow: responseMap,
      questionResponses,
    };

    let result;
    if (isAuthenticated()) {
      result = await saveDiagnosticDraft(payload);
    } else {
      // public draft requires respondentId field
      const publicPayload = {
        respondentId: Number(profile.id),
        ...payload,
      };
      result = await savePublicDraft(publicPayload);
    }

    if (!result.success) {
      if (!silent) {
        setDraftError(result.message || "Unable to save draft.");
        setDraftSaving(false);
      }
      return;
    }

    setResponses(answers);
    if (!silent) {
      setDraftInfo(result.message || "Draft saved.");
      setDraftSaving(false);
    }
  };

  const handleNextAutoSave = async (answers) => {
    await handleSaveDraft(answers, { silent: true });
  };

  const handleAssessmentFinish = async (answers) => {
    setSubmitError("");
    setDraftError("");
    setDraftInfo("");
    setSubmitting(true);

    const { responseMap, questionResponses, totalScore, totalWeightedScore } = buildAssessmentMetrics(answers);

    const payload = {
      respondentId: Number(profile?.id) || 0,
      firstName: String(profile?.firstName || "").trim(),
      lastName: String(profile?.lastName || "").trim(),
      email: String(profile?.email || "").trim(),
      mobile: String(profile?.mobile || "").trim(),
      submittedAt: new Date().toISOString(),
      totalScore,
      totalWeightedScore,
      answersByRow: responseMap,
      questionResponses,
    };

    const result = await submitPublicAssessment(payload);

    if (result?.alreadySubmitted) {
      setSubmitError(result.message || "Assessment already submitted. Assignment already done.");
      setSubmitting(false);
      return;
    }

    if (!result.success) {
      setSubmitError(result.message || "Failed to save assessment to database.");
      setSubmitting(false);
      return;
    }

    const draftResult = await deletePublicDraft(profile.id);

    if (!draftResult.success) {
      console.error("Failed to delete draft:", draftResult.message);
    }

    // inform user about email delivery status when available
    if (typeof result.mailSent !== "undefined") {
      if (result.mailSent) {
        setEmailInfo({
          status: "success",
          message: `Assessment complete — result emailed to ${String(profile?.email || "").trim()}`,
        });
      } else {
        setEmailInfo({
          status: "error",
          message: `Assessment complete — unable to email results to ${String(profile?.email || "").trim()}`,
        });
      }
    } else {
      setEmailInfo({
        status: "neutral",
        message: "Assessment complete — email status not available.",
      });
    }

    const completedEntry = {
      firstName: String(profile?.firstName || "").trim(),
      lastName: String(profile?.lastName || "").trim(),
      email: String(profile?.email || "").trim(),
      mobile: String(profile?.mobile || "").trim(),
      completedAt: new Date().toISOString(),
      responseCount: Object.keys(answers).length,
      answers,
    };

    persistCompletedAssessment(completedEntry);
    setCompletedAssessment(completedEntry);
    setResponses(answers);
    setStep("thankyou");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] px-4 py-8">
      {/* <div className="mx-auto max-w-5xl rounded-[28px] border-2 border-[#cd3cd3] bg-[#262626] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.6)] md:p-8"> */}
      <div key={step} className="font-mono text-[#c8a85b] transition-all duration-300">

        {step === "hero" && (
          <Hero
            onStart={() => {
              resetAssessmentSession();
              setDetailsError("");
              setProfile(EMPTY_PROFILE);
              setStep("details");
            }}
          />
        )}

        {step === "details" && (
          <UserDetails initialData={profile} continueError={detailsError} continueSaving={detailsSaving} onBack={returnToHeroWithFreshDetails} onContinue={handleDetailsContinue} />
        )}

        {step === "instructions" && (
          <Instructions onBack={() => setStep("details")} onBegin={() => setStep("assessment")} />
        )}

        {step === "assessment" &&
          (questionsLoading ? (
            <section>
              <div className="mb-6 mt-2 w-full max-w-[480px] border-t border-dashed border-[#cd3cd3]" />

              <p className="text-sm uppercase tracking-[0.06em] text-[#c8a85b]">
                Loading
              </p>

              <h2 className="mt-2 text-lg font-bold text-[#c8a85b] md:text-xl">
                Preparing assessment questions...
              </h2>

              <p className="mt-3 text-gray-300">
                Reading configured question file from leadership-assessment backend.
              </p>

              <div className="mt-4 h-2 w-40 animate-pulse rounded-full bg-[#cd3cd3]" />

              <div className="mb-2 mt-8 w-full max-w-[480px] border-t border-dashed border-[#cd3cd3]" />
            </section>
          ) : questionItems.length === 0 ? (
            <section>
              <div className="mb-6 mt-2 w-full max-w-[480px] border-t border-dashed border-[#cd3cd3]" />

              <p className="text-sm uppercase tracking-[0.06em] text-red-400">
                Question Load Failed
              </p>

              <h2 className="mt-2 text-lg font-bold text-[#c8a85b] md:text-xl">
                Questions could not be loaded
              </h2>

              <p className="mt-3 text-red-300">
                {questionsError ||
                  "No questions returned from source file."}
              </p>

              <div className="mb-5 mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep("instructions")} className="rounded-full border border-[#cd3cd3] px-5 py-2.5 text-sm text-[#c8a85b] transition hover:bg-[#cd3cd3]/10" >  Back  </button>

                <button type="button" onClick={() => loadQuestions()} className="rounded-full bg-[#c8a85b] px-5 py-2.5 text-sm font-semibold text-[#1c1c1c] transition hover:bg-[#d8b96b]" > Retry </button>
              </div>

              <div className="mb-2 w-full max-w-[480px] border-t border-dashed border-[#cd3cd3]" />
            </section>
          ) : (
            <>
              {submitError && (
                <p className="mb-3 rounded-lg border border-red-500 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  {submitError}
                </p>
              )}

              {draftError && (
                <p className="mb-3 rounded-lg border border-red-500 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  {draftError}
                </p>
              )}

              {submitting ? (
                <section className="min-h-screen bg-[#1c1c1c]">
                  <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
                    <div className="w-full max-w-3xl">

                      <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
                        LEAN IN COACHING
                      </p>

                      <h1 className="text-4xl font-bold text-[#c8a85b] md:text-5xl">Saving Assessment</h1>

                      <p className="mt-5 text-lg text-gray-400">Please wait while we securely save your responses.</p>

                      <div className="mt-10 rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">

                        <div className="flex items-center gap-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#cd3cd3] border-t-transparent" />

                          <div>
                            <p className="font-semibold text-[#c8a85b]">Saving your assessment...</p>

                            <p className="mt-1 text-sm text-gray-400"> Do not close this window.</p>
                          </div>
                        </div>

                        <div className="mt-8 h-3 overflow-hidden rounded-full bg-[#1c1c1c]">
                          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#c8a85b]" />
                        </div>

                      </div>

                    </div>
                  </div>
                </section>
              ) : (
                <QuestionsCard key={assessmentSessionKey} questions={questionItems} initialAnswers={responses} draftSaving={draftSaving}
                  draftNotice={draftInfo} onBack={() => setStep("instructions")} onNextAutoSave={handleNextAutoSave}
                  onSaveDraft={handleSaveDraft} onFinish={handleAssessmentFinish} />
              )}
            </>
          ))}

        {step === "thankyou" && (
          <ThankYou profile={completedAssessment || profile} mailInfo={emailInfo} onReturn={returnToHeroWithFreshDetails}
            responseCount={completedAssessment?.responseCount || Object.keys(responses).length} />
        )}
      </div>
    </div>
    // </div>
  );
}