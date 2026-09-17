import { useEffect, useState } from "react";
import { CheckCircle2, Mail, ArrowLeft } from "lucide-react";

const AUTO_RETURN_DELAY_SECONDS = 15;

export default function ThankYou({ profile, responseCount, mailInfo, onReturn, }) {
  const [countdown, setCountdown] = useState(AUTO_RETURN_DELAY_SECONDS);

  useEffect(() => {
    if (!onReturn) return;

    const id = setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(id);
      onReturn();
    }, AUTO_RETURN_DELAY_SECONDS * 1000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [onReturn]);

  const isCancelled = Boolean(profile?.isCancelled);
  const isReschedule = Boolean(profile?.isReschedule) && !isCancelled;
  const isExisting = Boolean(profile?.isExistingSubmission) && !isReschedule && !isCancelled;

  const scoring = profile?.scoring || null;
  const zoneMeta = {
    Green: {
      headline: "Strong foundation",
      subtitle: "Your leadership dynamic shows healthy decision patterns and open challenge.",
      cardClass: "border-green-500/40 bg-green-950/30",
      headlineClass: "text-green-300",
      barClass: "from-red-400 via-amber-300 to-green-400",
    },
    Amber: {
      headline: "Patterns worth exploring",
      subtitle: "Some patterns may be quietly limiting decision quality - often without being fully visible yet.",
      cardClass: "border-amber-500/40 bg-amber-950/30",
      headlineClass: "text-amber-300",
      barClass: "from-red-400 via-amber-300 to-green-400",
    },
    Red: {
      headline: "Blind spots worth addressing",
      subtitle: "Friction or unvoiced risks may be affecting how decisions currently get made.",
      cardClass: "border-red-500/40 bg-red-950/30",
      headlineClass: "text-red-300",
      barClass: "from-red-400 via-amber-300 to-green-400",
    },
  };
  const z = zoneMeta[scoring?.zone] || null;
  const markerLeft = scoring ? Math.min(96, Math.max(4, scoring.overallPct)) : 50;

  return (
    <section className="min-h-screen bg-[#1c1c1c]" style={{ fontFamily: '"Aptos", "Trebuchet MS", sans-serif' }} >
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full max-w-3xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
            LEAN IN COACHING
          </p>

          <h1 className="text-3xl font-bold text-[#c8a85b] md:text-3xl">
            {isCancelled ? "Discussion Slot Cancelled" : isReschedule ? "Discussion Slot Rescheduled"
                : isExisting ? "Assessment Already Completed" : "Assessment Complete"}
          </h1>

          <p className="mt-2 max-w-3xl text-lg leading-8 text-gray-400">
            {isCancelled ? "Your 20 mins discussion slot has been cancelled as requested."
              : isReschedule ? "Your 20 mins discussion slot has been updated."
                : isExisting ? "You have already completed the Leadership Reset Diagnostic."
                  : "Thank you for taking the Leadership Reset Diagnostic."}
          </p>

          <div className="mt-6 rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">

            <div className="mb-4 flex items-center gap-4">
              <div className={`rounded-full p-3 ${isCancelled ? "bg-red-500/20" : "bg-green-500/20"}`}>
                <CheckCircle2 size={30} className={isCancelled ? "text-red-400" : "text-green-400"} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#c8a85b]">
                  {isCancelled ? "Slot Cancelled" : "Thank you"}{profile?.firstName ? `, ${profile.firstName}` : ""}!
                </h2>

                <p className="mt-2 text-gray-400">
                  {isCancelled ? "Your discussion slot has been cancelled successfully. Email notifications have been sent to you and the coach."
                    : isReschedule ? "Your 20 mins discussion slot has been rescheduled successfully!"
                      : isExisting ? "Your assessment has already been submitted.": "Your assessment has been submitted successfully!"}
                </p>
                {profile?.email ? (
                  <div className="mt-2 space-y-1 text-sm text-gray-400">
                    <p>Email ID: <span className="text-[#c8a85b]">{profile.email}</span></p>
                    {profile?.submitted_at || profile?.completedAt ? (
                      <p>
                        {isCancelled ? "Cancelled on: " : isReschedule ? "Rescheduled on: " : "Submitted on: "}
                        <span className="text-[#c8a85b]">
                          {profile?.submitted_at ||
                            new Date(profile.completedAt || Date.now()).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* <div className="rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-4">
              <p className="text-lg text-[#c8a85b]">
                Questions Answered : {responseCount}
              </p>
            </div> */}

            {/* <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-4">
              <Mail className="mt-1 text-[#c8a85b]" size={20} />
              <div>
                <p className="font-semibold text-[#c8a85b]">
                  Email Confirmation:
                  <span className={`ml-2 text-sm ${mailInfo?.status === "success"
                        ? "text-green-400": mailInfo?.status === "error"? "text-red-400": "text-gray-400"
                      }`}>
                    {mailInfo?.message || "Your assessment has been recorded."}
                  </span>
                </p>
              </div>
            </div> */}

            {/* Teaser: zone result + one small action */}
            {!isCancelled && z && scoring?.action ? (
              <div className={`mt-6 rounded-2xl border p-6 text-center ${z.cardClass}`}>
                <h3 className={`text-2xl font-bold ${z.headlineClass}`}>{z.headline}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-300">
                  {z.subtitle}
                </p>

                {/* Spectrum slider: Blind spots -> Strong foundation */}
                <div className="mx-auto mt-5 max-w-md">
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500">
                    <div
                      className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow"
                      style={{ left: `${markerLeft}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>Blind spots</span>
                    <span>Strong foundation</span>
                  </div>
                </div>

                <div className="mx-auto mt-5 max-w-md rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#c8a85b]">
                    One small shift to try this week
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{scoring.action}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between">

              <button type="button" onClick={onReturn}
                className="inline-flex items-center gap-2 rounded-full border border-[#cd3cd3] px-6 py-4 font-semibold text-[#c8a85b] transition hover:bg-[#cd3cd3]/10">
                <ArrowLeft size={16} /> Back to Home
              </button>

              <p className="text-sm text-gray-500">Returning automatically in{" "}
                <span className="font-semibold text-[#c8a85b]">{countdown}s</span>
              </p>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}