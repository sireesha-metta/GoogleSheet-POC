import { useState } from "react";
import { Calendar as CalendarIcon, ExternalLink, CheckCircle, Loader2, X } from "lucide-react";

export default function CalendarWidget({ profile, onConfirm, onBack, isSubmitting = false, submitError = "" }) {
  const CALENDAR_URL = import.meta.env.VITE_CALENDAR_URL || "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2nhCtF_FHoxX0aAxYZKaN0_zgnhgx5zGgqkpQPp1at-6OLjCDMwR_z1mAKJ0uYbqVJzB8mS3HZ";

  // Build an embeddable calendar URL with pre-filled user details.
  // calendar.app.google short links ignore query params, so convert to the
  // direct appointments/schedules URL which supports prefill + iframe embed.
  const getPreFilledCalendarUrl = (rawUrl) => {
    let targetUrl = rawUrl || CALENDAR_URL;

    if (targetUrl.includes("calendar.app.google") && import.meta.env.VITE_CALENDAR_DIRECT_URL) {
      targetUrl = import.meta.env.VITE_CALENDAR_DIRECT_URL;
    }

    try {
      const u = new URL(targetUrl);
      // gv=true renders the embeddable scheduling view
      u.searchParams.set("gv", "true");
      if (profile?.email) {
        u.searchParams.set("email", String(profile.email).trim());
        u.searchParams.set("guest_email", String(profile.email).trim());
      }
      if (profile?.firstName) {
        u.searchParams.set("first_name", String(profile.firstName).trim());
        u.searchParams.set("fname", String(profile.firstName).trim());
      }
      if (profile?.lastName) {
        u.searchParams.set("last_name", String(profile.lastName).trim());
        u.searchParams.set("lname", String(profile.lastName).trim());
      }
      const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
      if (fullName) {
        u.searchParams.set("name", fullName);
      }
      return u.toString();
    } catch {
      return targetUrl;
    }
  };

  const activeCalendarUrl = getPreFilledCalendarUrl(CALENDAR_URL);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [hasOpenedCalendar, setHasOpenedCalendar] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isLoading = isSubmitting || localSubmitting;

  // Open the calendar as a full-width in-page modal (iframe embed)
  const handleOpenCalendar = () => {
    setHasOpenedCalendar(true);
    setShowCalendarModal(true);
  };

  // User finished picking a slot -> close popup and go straight to the
  // submit confirmation dialog on the parent page (book -> close -> confirm -> submit)
  const handleCloseCalendarModal = () => {
    setShowCalendarModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmClick = () => {
    if (isLoading) return;
    if (!hasOpenedCalendar) {
      setShowWarningModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const executeFinalSubmission = () => {
    setShowWarningModal(false);
    setShowConfirmModal(false);
    setLocalSubmitting(true);

    const bookingDetails = {
      calendarUrl: activeCalendarUrl,
      bookedVia: "Google Calendar",
      scheduledDate: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    onConfirm(bookingDetails);
  };

  const isRescheduleMode = Boolean(profile?.isReschedule);

  return (
    <section className="min-h-screen bg-[#1c1c1c] text-[#c8a85b]" style={{ fontFamily: '"Aptos", "Trebuchet MS", sans-serif' }}>
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="mb-1 text-xs md:text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
                LEAN IN COACHING
              </p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-[#c8a85b]">
                {isRescheduleMode ? "Reschedule Exploration Call" : "Book Exploration Call & Finalize"}
              </h1>
              <p className="mt-1 text-sm text-gray-300">
                Complete your 20-minute booking on Google Calendar and receive your diagnostic report.
              </p>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-[#c8a85b]/40 px-5 py-2 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#c8a85b]/10"
            >
              ← Back
            </button>
          </div>

          <div className="rounded-2xl border border-[#cd3cd3] bg-[#262626] p-6 md:p-10 shadow-2xl space-y-8">
            {/* STEP 1: BOOK EXPLORATION CALL */}
            <div className={`rounded-xl border p-6 md:p-8 shadow-lg transition-all ${hasOpenedCalendar ? "border-emerald-500/50 bg-[#1c2820]" : "border-[#c8a85b]/30 bg-[#1f1f1f]"}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`rounded-full px-3.5 py-1 text-xs font-bold tracking-wide uppercase ${hasOpenedCalendar ? "bg-emerald-500 text-black" : "bg-[#c8a85b] text-[#1c1c1c]"}`}>
                  {hasOpenedCalendar ? "✓ Step 1 Complete" : "Step 1 · Exploration Call"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {hasOpenedCalendar ? "Calendar Opened" : "Opens Here with Pre-fill"}
                </span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className={`rounded-2xl p-3.5 shrink-0 ${hasOpenedCalendar ? "bg-emerald-500/20 text-emerald-400" : "bg-[#c8a85b]/20 text-[#c8a85b]"}`}>
                  <CalendarIcon size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Book Exploration Call
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Schedule your 20-minute 1-on-1 session with Lorraine Burns. Your name and email are pre-filled automatically.
                  </p>
                </div>
              </div>

              {/* Participant Details Summary */}
              {/* <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#181818] p-4 rounded-xl border border-[#333] text-xs">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-[#c8a85b] shrink-0" />
                  <span className="text-gray-400">Name:</span>
                  <span className="font-semibold text-white truncate">{profile?.firstName || ""} {profile?.lastName || ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-[#c8a85b] shrink-0" />
                  <span className="text-gray-400">Email:</span>
                  <span className="font-semibold text-white truncate">{profile?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#c8a85b] shrink-0" />
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-semibold text-white">20 Mins (Google Meet)</span>
                </div>
              </div> */}

              {/* Opened Calendar Banner Notice */}
              {hasOpenedCalendar && (
                <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 flex items-center gap-2.5">
                  <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                  <span>
                    Once you select your date & time slot in the calendar popup, close it and click <strong>"Confirm & Complete Assessment"</strong> below!
                  </span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleOpenCalendar}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a85b] px-6 py-4 text-base md:text-lg font-bold text-[#1c1c1c] shadow-xl transition hover:bg-[#d8b96b] text-center"
              >
                {hasOpenedCalendar ? "Re-open Booking Calendar" : "Book Exploration Call"}
              </button>
              <p className="mt-2.5 text-center text-xs text-gray-400">
                After booking, the confirmation step opens automatically.
              </p>
              
            </div>

            {/* STEP 2: COMPLETE ASSESSMENT */}
            <div className={`rounded-xl border p-6 md:p-8 shadow-lg transition-all ${hasOpenedCalendar ? "border-[#cd3cd3] bg-[#221c24] ring-2 ring-[#cd3cd3]/30" : "border-[#cd3cd3]/30 bg-[#1f1f1f]"}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-[#cd3cd3] px-3.5 py-1 text-xs font-bold text-white tracking-wide uppercase">
                  Step 2 · Deliver Report
                </span>
                {/* <span className="text-xs text-gray-400 font-medium">
                  Instant PDF Delivery
                </span> */}
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="rounded-2xl bg-[#cd3cd3]/20 p-3.5 text-[#cd3cd3] shrink-0">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Finalize & Complete Assessment
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Once you have booked your appointment slot on Google Calendar, click below to securely record your diagnostic answers and receive your personalized PDF report by email.
                  </p>
                </div>
              </div>

              {submitError && (
                <div className="mb-4 rounded-xl border border-red-500/50 bg-red-900/30 p-4 text-sm text-red-200">
                  {submitError}
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#cd3cd3] px-6 py-4 text-base md:text-lg font-bold text-white shadow-xl transition hover:bg-[#b030b8] disabled:opacity-60 disabled:cursor-not-allowed text-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Submitting Assessment...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} /> Confirm & Complete Assessment
                  </>
                )}
              </button>
              <p className="mt-2.5 text-center text-xs text-gray-400">
                Saves diagnostic responses & sends your personalized PDF report to <span className="text-white font-medium">{profile?.email || "your email"}</span>.
              </p>
            </div>

            {/* Navigation Footer */}
            <div className="pt-4 border-t border-[#3a3a3a] flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-[#c8a85b]/40 px-6 py-2.5 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#c8a85b]/10"
              >
                ← Back to Questions
              </button>

              <span className="text-xs text-gray-400">
                Lean In Coaching · Leadership Reset Assessment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH CALENDAR MODAL (iframe embed, auto-filled) */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
          {/* Modal header */}
          <div className="flex items-center justify-between bg-[#1c1c1c] px-5 py-3 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-[#c8a85b]" />
              <div>
                <p className="text-sm font-bold text-white">Book your 20-minute Exploration Call</p>
                <p className="text-xs text-gray-400">
                  Booking as <span className="text-[#c8a85b] font-medium">{profile?.firstName || ""} {profile?.lastName || ""}</span>
                  {profile?.email ? <> · <span className="text-[#c8a85b] font-medium">{profile.email}</span></> : null}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseCalendarModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#cd3cd3] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#b030b8]"
            >
              <X size={16} /> Done — Close
            </button>
          </div>

          {/* Full-width iframe calendar */}
          <div className="relative flex-1 bg-white">
            <iframe
              src={activeCalendarUrl}
              title="Book Exploration Call"
              className="absolute inset-0 h-full w-full border-0"
              width="100%"
              height="100%"
              frameBorder="0"
            />
          </div>
        </div>
      )}

      {/* WARNING MODAL: IF CALENDAR WAS NOT OPENED */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/50 bg-[#262626] p-6 shadow-2xl text-left relative">
            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-amber-500 mb-3">
              {/* <AlertTriangle size={28} /> */}
              <h3 className="text-lg font-bold text-white">Have you booked your Leadership Diagnostic slot?</h3>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed mb-6">
              Please select an appointment time in Larraine's Calendar before submitting your assessment.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  handleOpenCalendar();
                  setShowWarningModal(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a85b] px-5 py-3.5 text-sm font-bold text-[#1c1c1c] shadow-lg transition hover:bg-[#d8b96b]"
              >
                <ExternalLink size={18} /> Open Google Calendar to Book Slot First ↗
              </button>

              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="w-full rounded-xl border border-gray-600 px-5 py-2.5 text-xs font-semibold text-gray-400 transition hover:bg-white/5"
              >
                Cancel & Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: IF CALENDAR WAS ALREADY OPENED */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#cd3cd3]/50 bg-[#262626] p-6 shadow-2xl text-left relative">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-[#cd3cd3] mb-3">
              <CheckCircle size={28} />
              <h3 className="text-lg font-bold text-white">Finalize & Submit Assessment</h3>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Are you ready to submit your diagnostic answers and deliver your personalized PDF report to <strong className="text-white">{profile?.email || "your registered email"}</strong>?
            </p>

            <div className="mb-6 p-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-xs space-y-1.5 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Participant:</span>
                <span className="font-semibold text-white">{profile?.firstName || ""} {profile?.lastName || ""}</span>
              </div>
              <div className="flex justify-between border-t border-[#2a2a2a] pt-1.5">
                <span className="text-gray-400">Delivery Email:</span>
                <span className="font-semibold text-white">{profile?.email || "—"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={executeFinalSubmission}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#cd3cd3] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#b030b8]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Confirm & Deliver PDF Report
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full rounded-xl border border-gray-600 px-5 py-2.5 text-xs font-semibold text-gray-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
