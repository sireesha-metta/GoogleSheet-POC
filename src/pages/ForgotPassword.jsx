import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import FormInput from "../component/FormInput";
import { isAuthenticated, getDefaultAuthenticatedPath, requestPasswordReset } from "../utils/auth";
import { validators } from "../utils/validation";
import humanhill from "../assets/human-hill.jpg";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getDefaultAuthenticatedPath(), { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    const emailError = validators.email(email);
    if (emailError) {
      setError(emailError);
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setMessage("");

    const result = await requestPasswordReset(email);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || "Unable to process your request.");
      return;
    }

    setIsSubmitted(true);
    setMessage(result.message || "If your email is registered, a reset link has been sent.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <img
        src={humanhill}
        alt="Leadership"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-slate-950/80" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center justify-center px-4 py-8 md:px-10 lg:px-14">
        <div className="w-full max-w-[560px] rounded-[32px] border border-yellow-300/60 bg-gradient-to-br from-[#1c1c1c]/95 via-[#243b55]/90 to-[#141e30]/95 p-6 shadow-2xl backdrop-blur-md md:p-8">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-yellow-300/50 hover:text-yellow-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Login
          </button>

          <div className="mt-6 text-center">
            <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">
              Forgot Password
            </h1>

            <p className="mt-3 text-lg italic text-white/80">
              Regain access to your leadership assessment account.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="rounded-2xl border border-white/15 bg-slate-900/40 p-4 text-sm text-slate-200">
                Enter your registered email address. If an account exists, we will send reset instructions.
              </div>

              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />

                <FormInput
                  type="email"
                  value={email}
                  placeholder="Registered Email Address"
                  autoComplete="email"
                  error={error}
                  showErrorInPlaceholder={true}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mx-auto block w-full max-w-[320px] rounded-2xl bg-yellow-500 px-6 py-3 text-center text-base font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="inline-flex items-center gap-2">
                  <PaperAirplaneIcon className="h-5 w-5" />
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </span>
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-5 text-center">
              <ShieldCheckIcon className="mx-auto h-11 w-11 text-emerald-300" />

              <p className="mt-3 text-base text-emerald-100">{message}</p>

              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
                >
                  Return to Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                    setError("");
                    setMessage("");
                  }}
                  className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-yellow-300/50 hover:text-yellow-300"
                >
                  Try Another Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}