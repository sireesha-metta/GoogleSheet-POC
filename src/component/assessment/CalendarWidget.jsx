import { useState } from "react";
import { Calendar as CalendarIcon, ExternalLink, CheckCircle, Loader2 } from "lucide-react";

export default function CalendarWidget({ profile, onConfirm, onBack, isSubmitting = false, submitError = "" }) {
  const LORRAINE_CALENDAR_URL = "https://calendar.app.google/4GCBEaieg6fSogtv9";
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const isLoading = isSubmitting || localSubmitting;

  const handleConfirmSubmission = () => {
    if (isLoading) return;
    setLocalSubmitting(true);

    const bookingDetails = {
      calendarUrl: LORRAINE_CALENDAR_URL,
      bookedVia: "Lorraine's Google Calendar",
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
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs md:text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
                LEAN IN COACHING
              </p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-[#c8a85b]">
                {isRescheduleMode ? "Reschedule Your Discussion Slot" : "Schedule Discussion with Lorraine Burns"}
              </h1>
              <p className="mt-1 text-sm text-gray-300">
                Book your 20-minute discussion directly on Lorraine's Google Calendar.
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

          <div className="rounded-2xl border border-[#cd3cd3] bg-[#262626] p-6 md:p-8 shadow-2xl">
            {/* Top Info & Direct Link Bar */}
            <div className="mb-6 rounded-xl border border-[#c8a85b]/40 bg-[#1f1f1f] p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#c8a85b]/20 p-2.5 text-[#c8a85b]">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-white">
                    Lorraine Burns Google Calendar
                  </h2>
                  <p className="text-xs text-gray-300">
                    20 min session · Video conference info (Google Meet) added after booking
                  </p>
                </div>
              </div>

              <a
                href={LORRAINE_CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#c8a85b] px-6 py-2.5 text-sm font-bold text-[#1c1c1c] shadow-lg transition hover:bg-[#d8b96b]"
              >
                Open Calendar in Full Tab <ExternalLink size={16} />
              </a>
            </div>

            {/* WHITE CONTAINER for Google Calendar (fixes dark mode text contrast issue completely) */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-300 bg-white p-2 shadow-2xl">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between rounded-t-xl">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  Google Calendar Appointment Booking View
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  https://calendar.app.google
                </span>
              </div>

              <div className="w-full bg-white" style={{ minHeight: "680px", colorScheme: "light" }}>
                <iframe
                  src={LORRAINE_CALENDAR_URL}
                  width="100%"
                  height="680"
                  frameBorder="0"
                  title="Lorraine Burns Google Calendar"
                  className="w-full rounded-b-xl border-0 bg-white"
                  style={{ backgroundColor: "#ffffff", colorScheme: "light" }}
                />
              </div>
            </div>

            {submitError && (
              <div className="mb-6 rounded-xl border border-red-500/50 bg-red-900/30 p-4 text-sm text-red-200">
                {submitError}
              </div>
            )}

            {/* Footer Action Controls */}
            <div className="pt-4 border-t border-[#3a3a3a] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-[#c8a85b]/40 px-6 py-2.5 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#c8a85b]/10"
              >
                ← Back
              </button>

              <div className="flex items-center gap-3">
                <a
                  href={LORRAINE_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#c8a85b] px-6 py-2.5 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#c8a85b]/10"
                >
                  Open Direct Link ↗
                </a>

                <button
                  type="button"
                  onClick={handleConfirmSubmission}
                  disabled={isLoading}
                  className="rounded-full bg-[#c8a85b] px-8 py-3 text-sm font-bold text-[#1c1c1c] shadow-lg transition hover:bg-[#d8b96b] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting Assessment...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Confirm & Complete Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
