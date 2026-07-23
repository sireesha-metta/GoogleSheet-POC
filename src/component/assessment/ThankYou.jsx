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

  return (
    <section className="min-h-screen bg-[#1c1c1c]" style={{ fontFamily: '"Aptos", "Trebuchet MS", sans-serif' }} >
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full max-w-3xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
            LEAN IN COACHING
          </p>

          <h1 className="text-3xl font-bold text-[#c8a85b] md:text-3xl">
            Assessment Complete
          </h1>

          <p className="mt-2 max-w-3xl text-lg leading-8 text-gray-400">
            Thank you for taking the Leadership Reset Diagnostic.
          </p>

          <div className="mt-6 rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">

            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <CheckCircle2 size={30} className="text-green-400" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#c8a85b]">Thank you, {profile?.firstName}! </h2>

                <p className="mt-2 text-gray-400">Your assessment has been submitted successfully. </p>
                {profile?.email ? (
                  <p className="mt-1 text-sm text-gray-500">
                    Email ID: <span className="text-[#c8a85b]">{profile.email}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-4">
              <p className="text-lg text-[#c8a85b]">
                Questions Answered : {responseCount}
              </p>

              {/* <p className="mt-2 text-3xl font-bold text-white">
                {responseCount}
              </p> */}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-4">
              <Mail className="mt-1 text-[#c8a85b]" size={20} />

              <div>
                <p className="font-semibold text-[#c8a85b]">
                  Email Confirmation:
                  <span
                    className={`ml-2 text-sm ${mailInfo?.status === "success"
                        ? "text-green-400"
                        : mailInfo?.status === "error"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                  >
                    {mailInfo?.message || "Your assessment has been recorded."}
                  </span>
                </p>
              </div>
            </div>

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