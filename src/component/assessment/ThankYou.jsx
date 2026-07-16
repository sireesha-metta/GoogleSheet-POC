import { useEffect, useState } from "react";

export default function ThankYou({ profile, responseCount, mailInfo, onReturn }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!onReturn) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    const tid = setTimeout(() => {
      clearInterval(id);
      onReturn();
    }, 5000);
    return () => {
      clearTimeout(tid);
      clearInterval(id);
    };
  }, [onReturn]);

  return (
    <section className="rounded-3xl bg-white p-10 shadow-xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[4px] text-[#7A8B74]">Completed</p>
      <h2 className="mb-4 text-3xl font-bold text-[#21302B]">Thank you, {profile?.firstName}.</h2>

      <p className="max-w-2xl leading-7 text-[#4f5a54]">
        Your assessment is recorded. You answered {responseCount} question(s).
      </p>

      {mailInfo ? (
        <p
          className={
            "mt-4 rounded-lg px-4 py-2 text-sm " +
            (mailInfo.status === "success"
              ? "border border-green-300 bg-green-50 text-green-800"
              : mailInfo.status === "error"
              ? "border border-red-300 bg-red-50 text-red-800"
              : "border border-gray-300 bg-gray-50 text-gray-800")
          }
        >
          {mailInfo?.message || (typeof mailInfo === "string" ? mailInfo : JSON.stringify(mailInfo))}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[#4f5a54]">We did not send an email confirmation.</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onReturn && onReturn()}
          className="rounded-full border border-[#cd3cd3] px-5 py-2.5 text-sm text-[#c8a85b] transition hover:bg-[#cd3cd3]/10"
        >
          Back to Home
        </button>

        <span className="text-sm text-[#7a7a7a]">Auto-returning in {countdown}s...</span>
      </div>
    </section>
  );
}