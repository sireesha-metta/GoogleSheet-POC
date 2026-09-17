import { useEffect, useState } from "react";

import Hero from "../component/assessment/Hero";
import UserDetails from "../component/assessment/UserDetails";
import DiagnosticHub from "../component/assessment/DiagnosticHub";
import Instructions from "../component/assessment/Instructions";
import QuestionsCard from "../component/assessment/QuestionsCard";
import OneWordInput from "../component/assessment/OneWordInput";
import CalendarWidget from "../component/assessment/CalendarWidget";
import ThankYou from "../component/assessment/ThankYou";
import { getQuestions, isAuthenticated, saveAssessmentRespondent, submitPublicAssessment, savePublicDraft, loadPublicDraft, deletePublicDraft, cancelAssessmentBooking } from "../utils/auth";
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

export default function Assessment() {
  const [step, setStep] = useState("hero");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [assessmentSessionKey, setAssessmentSessionKey] = useState(0);
  const [responses, setResponses] = useState({});
  const [oneWordAnswers, setOneWordAnswers] = useState([]);
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
    setOneWordAnswers([]);
    setDraftInfo("");
    setDraftError("");
    setSubmitError("");
    setEmailInfo(null);
    setCompletedAssessment(null);
  };

  const returnToHeroWithFreshDetails = () => {
    localStorage.removeItem(COMPLETED_ASSESSMENT_STORAGE_KEY);
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

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const stepParam = searchParams.get("step");
      const emailParam = searchParams.get("email");
      const actionParam = searchParams.get("action");

      if (emailParam) {
        const decodedEmail = decodeURIComponent(emailParam).trim().toLowerCase();
        const isReschedule = actionParam === "reschedule";
        const isCancel = actionParam === "cancel";

        setProfile((prev) => ({
          ...prev,
          email: decodedEmail,
          isReschedule,
          isCancel,
        }));

        saveAssessmentRespondent({
          firstName: "",
          lastName: "",
          email: decodedEmail,
        }).then((res) => {
          if (activeRef.current) {
            const data = res?.data || {};
            setProfile((prev) => ({
              ...prev,
              firstName: data.firstName || prev.firstName || "",
              lastName: data.lastName || prev.lastName || "",
              email: decodedEmail,
              mobile: data.mobile || prev.mobile || "",
              id: data.id || prev.id || null,
              isReschedule,
              isCancel,
            }));
          }
        }).catch(() => {
          if (activeRef.current) {
            setProfile((prev) => ({ ...prev, email: decodedEmail, isReschedule, isCancel }));
          }
        });

        if (stepParam === "calendar" || isReschedule || isCancel) {
          setStep("calendar");
          return () => {
            activeRef.current = false;
          };
        }
      }
    }

    setStep("hero");

    return () => {
      activeRef.current = false;
    };
  }, []);

  const handleDetailsContinue = async (details) => {
    setDetailsError("");
    resetAssessmentSession();
    setDetailsSaving(true);

    const result = await saveAssessmentRespondent({
      firstName: String(details?.firstName || "").trim(),
      lastName: String(details?.lastName || "").trim(),
      email: String(details?.email || "").trim(),
      mobile: String(details?.mobile || "").trim(),
    });

    if (result?.alreadySubmitted) {
      const returnedData = result?.data || {};
      const rawSubmittedAt = returnedData?.submittedAt || null;
      const completedEntry = {
        firstName: String(details?.firstName || "").trim(),
        lastName: String(details?.lastName || "").trim(),
        email: String(details?.email || "").trim(),
        mobile: String(details?.mobile || "").trim(),
        isExistingSubmission: true,
        submitted_at: rawSubmittedAt || new Date().toLocaleString(),
        completedAt: rawSubmittedAt,
        responseCount: 12,
        answers: {},
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

    const returned = result.data || {};
    const respondentId = returned.id || (returned?.data && returned.data.id) || null;
    setProfile({ ...details, id: respondentId });
    setResponses({});
    setAssessmentSessionKey((current) => current + 1);

    if (!isAuthenticated() && Number.isFinite(Number(respondentId)) && Number(respondentId) > 0) {
      try {
        const draftRes = await loadPublicDraft(respondentId);
        if (draftRes.success && draftRes.data) {
          const draftData = draftRes.data || {};
          setResponses(draftData.answersByRow || {});
          setDraftInfo(`Resume saved progress — ${Number(draftData.answeredCount || 0)}/${Number(draftData.totalQuestions || 0)} answered.`);
        }
      } catch {}
    }

    setStep("hub");
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

    if (!profile?.id) {
      if (!silent) {
        setDraftError("Respondent ID is required to save a public draft.");
      }
      return;
    }

    const { responseMap, questionResponses, totalScore, totalWeightedScore, answeredCount } = buildAssessmentMetrics(answers);

    const payload = {
      respondent: `${String(profile?.firstName || "").trim()} ${String(profile?.lastName || "").trim()}`.trim() || "Anonymous",
      savedAt: new Date().toISOString(),
      answeredCount,
      totalQuestions: questionItems.length,
      totalScore,
      totalWeightedScore,
      answersByRow: responseMap,
      questionResponses,
      oneWordAnswers,
    };

    const publicPayload = {
      respondentId: Number(profile.id),
      ...payload,
    };
    const result = await savePublicDraft(publicPayload);

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

  const handleQuestionsDone = (answers) => {
    setResponses(answers);
    setStep("oneword");
  };

  const handleOneWordDone = (words) => {
    setOneWordAnswers(words);
    setStep("calendar");
  };

  const handleAssessmentFinish = async (answers, bookingDetails = null) => {
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
      oneWordAnswers,
      bookingDetails,
    };

    const result = await submitPublicAssessment(payload);

    if (result?.alreadySubmitted) {
      setSubmitError(result.message || "Assessment already submitted.");
      setSubmitting(false);
      return;
    }

    if (!result.success) {
      setSubmitError(result.message || "Failed to save assessment to database.");
      setSubmitting(false);
      return;
    }

    await deletePublicDraft(profile.id);

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
    }

    const nowIso = new Date().toISOString();
    const formattedNow = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isReschedule = Boolean(profile?.isReschedule || bookingDetails?.isReschedule);

    const completedEntry = {
      firstName: String(profile?.firstName || "").trim(),
      lastName: String(profile?.lastName || "").trim(),
      email: String(profile?.email || "").trim(),
      mobile: String(profile?.mobile || "").trim(),
      isExistingSubmission: false,
      isReschedule,
      submitted_at: formattedNow,
      completedAt: nowIso,
      responseCount: Object.keys(answers).length || 12,
      answers,
      oneWordAnswers,
    };

    persistCompletedAssessment(completedEntry);
    setProfile((prev) => ({ ...prev, ...completedEntry, isReschedule }));
    setCompletedAssessment({ ...completedEntry, scoring: result?.scoring || null });
    setResponses(answers);
    setStep("thankyou");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] px-4 py-8">
      <div key={step} className="text-[#c8a85b] transition-all duration-300" style={{ fontFamily: '"Aptos", "Trebuchet MS", sans-serif' }}>
        {step === "hero" && (
          <Hero onStart={() => { resetAssessmentSession(); setDetailsError(""); setProfile(EMPTY_PROFILE); setStep("details"); }} />
        )}

        {step === "details" && (
          <UserDetails initialData={profile} continueError={detailsError} continueSaving={detailsSaving} onBack={returnToHeroWithFreshDetails} onContinue={handleDetailsContinue} />
        )}

        {step === "hub" && (
          <DiagnosticHub profile={profile} onBack={() => setStep("details")} onSelectDiagnostic={() => setStep("instructions")} />
        )}

        {step === "instructions" && (
          <Instructions onBack={() => setStep("hub")} onBegin={() => setStep("assessment")} />
        )}

        {step === "assessment" &&
          (questionsLoading ? (
            <section className="text-center py-20">
              <p className="text-sm uppercase tracking-[0.06em] text-[#c8a85b]"> Loading </p>
              <h2 className="mt-2 text-lg font-bold text-[#c8a85b] md:text-xl"> Preparing assessment questions...</h2>
              <div className="mt-4 mx-auto h-2 w-40 animate-pulse rounded-full bg-[#cd3cd3]" />
            </section>
          ) : questionItems.length === 0 ? (
            <section className="text-center py-20">
              <p className="text-sm uppercase tracking-[0.06em] text-red-400">Question Load Failed</p>
              <p className="mt-3 text-red-300">{questionsError || "No questions returned from source file."}</p>
              <button type="button" onClick={() => loadQuestions()} className="mt-4 rounded-full bg-[#c8a85b] px-5 py-2.5 text-sm font-semibold text-[#1c1c1c]"> Retry </button>
            </section>
          ) : (
            <>
              {submitError && <p className="mb-3 rounded-lg border border-red-500 bg-red-900/20 px-3 py-2 text-sm text-red-300">{submitError}</p>}
              {draftError && <p className="mb-3 rounded-lg border border-red-500 bg-red-900/20 px-3 py-2 text-sm text-red-300">{draftError}</p>}
              <QuestionsCard key={assessmentSessionKey} questions={questionItems} initialAnswers={responses} draftSaving={draftSaving}
                draftNotice={draftInfo} onBack={() => setStep("instructions")} onNextAutoSave={handleNextAutoSave}
                onSaveDraft={handleSaveDraft} onFinish={handleQuestionsDone} />
            </>
          ))}

        {step === "oneword" && (
          <OneWordInput onBack={() => setStep("assessment")} onContinue={handleOneWordDone} />
        )}

        {step === "calendar" && profile?.isCancel ? (
          <section className="min-h-screen bg-[#1c1c1c]" style={{ fontFamily: '"Aptos", "Trebuchet MS", sans-serif' }}>
            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
              <div className="w-full max-w-3xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">LEAN IN COACHING</p>
                <h1 className="text-3xl font-bold text-[#c8a85b]">Cancel Discussion Slot</h1>
                <p className="mt-2 text-lg text-gray-400">Manage or cancel your scheduled discussion slot with your coach.</p>
                <div className="mt-6 rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">
                  <p className="text-gray-300 mb-6">Confirm cancellation for <span className="font-semibold text-[#c8a85b]">{profile.email}</span>?</p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      const res = await cancelAssessmentBooking(profile.email);
                      setSubmitting(false);
                      if (res.success) {
                        const cancelledEntry = { ...profile, isCancelled: true, submitted_at: new Date().toLocaleTimeString() };
                        setCompletedAssessment(cancelledEntry);
                        setProfile(cancelledEntry);
                        setStep("thankyou");
                      } else {
                        setSubmitError(res.message || "Failed to cancel appointment.");
                      }
                    }}
                    className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : step === "calendar" && (
          <CalendarWidget profile={profile} isSubmitting={submitting} submitError={submitError} onBack={() => setStep("oneword")}
            onConfirm={(bookingDetails) => handleAssessmentFinish(responses, bookingDetails)} />
        )}

        {step === "thankyou" && (
          <ThankYou profile={completedAssessment || profile} mailInfo={emailInfo}
            onReturn={returnToHeroWithFreshDetails} responseCount={questionItems.length} />
        )}
      </div>
    </div>
  );
}