import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getDefaultAuthenticatedPath, getDefaultAuthenticatedPathForRole, isAuthenticated, loginUser, registerUser, requestPasswordReset } from "../utils/auth";
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, QuestionMarkCircleIcon, EnvelopeIcon, PhoneIcon, PaperAirplaneIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { INITIAL_REGISTER_FORM, INITIAL_REGISTER_ERRORS, } from "../types/register.types";
import FormInput from "../component/FormInput";
import { validators } from "../utils/validation";
import humanhill from "../assets/human-hill.jpg";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loginInfoMessage, setLoginInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotErrors, setForgotErrors] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [showForgotPasswordText, setShowForgotPasswordText] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const [registerForm, setRegisterForm] = useState(
    INITIAL_REGISTER_FORM
  );

  const [registerErrors, setRegisterErrors] = useState(
    INITIAL_REGISTER_ERRORS
  );

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getDefaultAuthenticatedPath(), { replace: true });
    }
  }, [navigate]);

  const requestedPath = location.state?.from?.pathname || null;

  const validateRegisterForm = (form) => {
    const errors = {};

    if (!form.firstName.trim()) {
      errors.firstName = "First Name is required";
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last Name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
      console.log("Email:", form.email);
      console.log("Validator Result:", validators.email(form.email));
    } else {
      const emailError = validators.email(form.email);
      if (emailError) errors.email = emailError;
    }

    if (!form.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else {
      const mobileError = validators.mobile(form.mobile);
      if (mobileError) errors.mobile = mobileError;
    }

    if (!form.password.trim()) {
      errors.password = "Password is required";
    }

    if (!form.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm Password is required";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setRegisterErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validateForgotPassword = () => {
    const newErrors = { email: "", newPassword: "", confirmPassword: "" };

    if (!forgotEmail.trim()) {
      newErrors.email = "Email is required";
    }

    const emailError = validators.email(forgotEmail);
    if (!newErrors.email && emailError) {
      newErrors.email = emailError;
    }

    if (!forgotNewPassword.trim()) {
      newErrors.newPassword = "Password is required";
    }

    if (!forgotConfirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (forgotNewPassword !== forgotConfirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setForgotErrors(newErrors);
    return !newErrors.email && !newErrors.newPassword && !newErrors.confirmPassword;
  };


  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setErrors({});
    setLoginInfoMessage("");
    setIsSubmitting(true);

    const result = await loginUser({ email, password, rememberMe });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({
        password: result.message || "Invalid email or password",
      });
      return;
    }

    const roleDefaultPath = getDefaultAuthenticatedPathForRole(result.session?.role);
    const nextPath =
      !requestedPath || requestedPath === "/" || requestedPath === "/login" || requestedPath === "/welcome"
        ? roleDefaultPath
        : requestedPath === "/dashboard" && roleDefaultPath !== "/dashboard"
          ? roleDefaultPath
          : requestedPath;

    navigate(nextPath, { replace: true });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const errors = validateRegisterForm(registerForm);

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    const result = await registerUser(registerForm);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setRegisterForm(INITIAL_REGISTER_FORM);
    setShowRegister(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!validateForgotPassword()) return;

    setIsForgotSubmitting(true);
    setLoginInfoMessage("");

    const result = await requestPasswordReset({
      email: forgotEmail,
      newPassword: forgotNewPassword,
    });

    setIsForgotSubmitting(false);

    if (!result.success) {
      setForgotErrors((prev) => ({
        ...prev,
        email: result.message || "Unable to process your request.",
      }));
      return;
    }

    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotErrors({ email: "", newPassword: "", confirmPassword: "" });
    setShowForgotPasswordText(false);
    // setLoginInfoMessage(result.message || "Password updated successfully.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <img src={humanhill} alt="Leadership" className="absolute inset-0 h-full w-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-slate-950/80" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center justify-between gap-8 px-4            py-8 md:px-10 lg:px-14">
        <div className="hidden max-w-[420px] md:block">
          <h3 className="font-serif text-2xl lg:text-2xl leading-tight text-white drop-shadow-xl">
            <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-500/10 px-5 py-2 text-yellow-200 shadow-sm mb-10">
              LEAN IN COACHING
            </span>
          </h3>
          <h4 className="font-serif text-2xl lg:text-2xl leading-tight text-white drop-shadow-xl">
            <span className="italic text-white">
              Awaken the Leader Within
            </span>
          </h4>

          <div className="my-5 h-px w-40 bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />

          <p className="font-serif text-lg lg:text-xl italic text-white/90">
            Elevate. Empower. Excel.
          </p>
        </div>

        <div className="w-full md:max-w-[500px]">
          <div className="rounded-[32px] border border-yellow-300/60 
              bg-gradient-to-br from-[#1c1c1c]/95 via-[#243b55]/90 to-[#141e30]/95 
              p-6 shadow-2xl backdrop-blur-md md:p-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">
                Login
              </h1>

              <div className="mt-7 border-t border-white/20 pt-5 text-center">

                <p className="mt-3 text-lg italic text-white/80">
                  Access Your Leadership Assessment Account
                </p>

              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              {loginInfoMessage && (
                <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {loginInfoMessage}
                </div>
              )}

              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />

                <FormInput
                  type="email"
                  value={email}
                  placeholder="Email / Phone number"
                  error={errors.email}
                  showErrorInPlaceholder={true}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      email: "",
                    }));
                  }}
                />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />

                <FormInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Password"
                  error={errors.password}
                  showErrorInPlaceholder={true}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      password: "",
                    }));
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-10 -translate-y-1/2 text-white/95"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-6 w-6" />
                  ) : (
                    <EyeIcon className="h-6 w-6" />
                  )}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4 text-sm md:text-base">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-slate-200 text-sm font-medium transition hover:text-yellow-300"
                  >
                    Register Here!
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setLoginInfoMessage("");
                      setForgotEmail(email);
                      setForgotErrors({ email: "", newPassword: "", confirmPassword: "" });
                    }}
                    className="text-slate-200 text-sm font-medium transition hover:text-yellow-300"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mx-auto block w-full max-w-[260px] rounded-2xl bg-yellow-500 px-6 py-3 text-center text-base font-semibold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Signing in..." : "Login"}
                </button>
              </div>
            </form>

            <div className="mt-7 border-t border-white/20 pt-5 text-center">

              <p className="mt-3 text-lg italic text-white/80">
                Unlock Your Leadership Potential
              </p>

            </div>

          </div>
        </div>
      </div>

      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20
                  bg-gradient-to-br from-[#334a80] via-[#3d5fa3] to-[#2a3d66] p-10 shadow-2xl">

            <h2 className="text-center text-2xl font-serif text-yellow-300 mb-6">
              Create Your Leadership Assessment Account
            </h2>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                  <FormInput type="text" name="firstName" placeholder="First Name" value={registerForm.firstName}
                    onChange={handleRegisterChange} error={registerErrors.firstName} showErrorInPlaceholder={true} />
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                  <FormInput type="text" name="lastName" placeholder="Last Name" value={registerForm.lastName}
                    onChange={handleRegisterChange} error={registerErrors.lastName} showErrorInPlaceholder={true} />
                </div>
              </div>

              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput type="tel" name="mobile" placeholder="Mobile Number" value={registerForm.mobile}
                  onChange={handleRegisterChange} error={registerErrors.mobile} showErrorInPlaceholder={true} />
              </div>

              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />

                <FormInput type="email" name="email" placeholder="Email Address" value={registerForm.email} showErrorInPlaceholder={true}
                  onChange={handleRegisterChange} error={registerErrors.email} />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />

                <FormInput type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={registerForm.password} autoComplete="current-password"
                  onChange={handleRegisterChange} error={registerErrors.password} showErrorInPlaceholder={true} />

                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/95" >
                  {showPassword ? (<EyeSlashIcon className="h-6 w-6" />) : (<EyeIcon className="h-6 w-6" />)}
                </button>
              </div>

              <div className="relative">
                <QuestionMarkCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />

                <FormInput type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password"
                  value={registerForm.confirmPassword} showErrorInPlaceholder={true}
                  onChange={handleRegisterChange} error={registerErrors.confirmPassword} />

                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-4 right-10 text-white" >
                  {showPassword ? (<EyeSlashIcon className="h-6 w-6" />) : (<EyeIcon className="h-6 w-6" />)}
                </button>

              </div>

            </div>

            <div className="flex justify-center gap-4 pt-6">
              <button onClick={() => setShowRegister(false)} className="px-6 py-2 rounded-lg bg-gray-500 text-white"  >
                Cancel
              </button>

              <button type="button" onClick={handleRegister}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-black font-semibold bg-gradient-to-b from-yellow-300 to-yellow-400 disabled:cursor-not-allowed disabled:opacity-70" >
                <RocketLaunchIcon className="h-5 w-5" />
                Register Here
              </button>
            </div>

          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/70 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-gradient-to-br from-[#334a80] via-[#3d5fa3] to-[#2a3d66] p-8 shadow-2xl">
            <h2 className="text-center text-2xl font-serif text-yellow-300 mb-3">
              Forgot Password
            </h2>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              {/* <p className="rounded-xl border border-white/15 bg-slate-900/40 p-3 text-sm text-slate-100">
                Enter your registered email and set a new password to update it directly.
              </p> */}

              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type="email"
                  value={forgotEmail}
                  placeholder="Registered Email Address"
                  autoComplete="email"
                  error={forgotErrors.email}
                  showErrorInPlaceholder={true}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setForgotErrors((prev) => ({ ...prev, email: "" }));
                  }}
                />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type={showForgotPasswordText ? "text" : "password"}
                  value={forgotNewPassword}
                  placeholder="New Password"
                  autoComplete="current-password"
                  autocomplete="off"
                  error={forgotErrors.newPassword}
                  showErrorInPlaceholder={true}
                  onChange={(e) => {
                    setForgotNewPassword(e.target.value);
                    setForgotErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowForgotPasswordText((prev) => !prev)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/95"
                >
                  {showForgotPasswordText ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                </button>
              </div>

              <div className="relative">
                <QuestionMarkCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type={showForgotPasswordText ? "text" : "password"}
                  value={forgotConfirmPassword}
                  placeholder="Confirm New Password"
                  autoComplete="current-password"
                  error={forgotErrors.confirmPassword}
                  showErrorInPlaceholder={true}
                  onChange={(e) => {
                    setForgotConfirmPassword(e.target.value);
                    setForgotErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                />
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail("");
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                    setForgotErrors({ email: "", newPassword: "", confirmPassword: "" });
                    setShowForgotPasswordText(false);
                  }}
                  className="px-6 py-2 rounded-lg bg-gray-500 text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-black font-semibold bg-gradient-to-b from-yellow-300 to-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  {isForgotSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>


  );
}

