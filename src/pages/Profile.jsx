import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthSession, updateAuthSession, logoutUser, fetchAuthProfile } from "../utils/auth";
import FormInput from "../component/FormInput";
import { validators } from "../utils/validation";
import { changePassword } from "../utils/auth";
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  LockClosedIcon,
  QuestionMarkCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function Profile() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session) return;

    const sessionUser = session.user || session;
    const savedFirst = sessionUser.firstName || sessionUser.firstname || "";
    const savedLast = sessionUser.lastName || sessionUser.lastname || "";
    const savedEmail = sessionUser.email || session.email || "";
    const savedMobile = sessionUser.mobile || sessionUser.phone || sessionUser.phoneNumber || session.mobile || "";
    const savedName = sessionUser.name || session.name || "";

    if (!savedFirst && !savedLast && savedName) {
      const parts = savedName.trim().split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    } else {
      setFirstName(savedFirst);
      setLastName(savedLast);
    }

    setEmail(savedEmail);
    setMobile(savedMobile);

    if (!savedFirst && !savedLast && !savedMobile && !savedEmail) {
      fetchAuthProfile().then((result) => {
        if (!result.success) return;
        const profile = result.profile || {};
        const profileFirst = profile.firstName || profile.firstname || "";
        const profileLast = profile.lastName || profile.lastname || "";
        const profileEmail = profile.email || "";
        const profileMobile = profile.mobile || profile.phone || profile.phoneNumber || "";

        if (profileFirst || profileLast) {
          setFirstName(profileFirst);
          setLastName(profileLast);
        }
        if (profileEmail) setEmail(profileEmail);
        if (profileMobile) setMobile(profileMobile);

        updateAuthSession({
          firstName: profileFirst,
          lastName: profileLast,
          email: profileEmail,
          mobile: profileMobile,
          name: `${profileFirst} ${profileLast}`.trim() || profile.name || session.name,
        });
      });
    }
  }, [session]);

  const firstRef = useRef(null);
  const lastRef = useRef(null);
  const mobileRef = useRef(null);
  const emailRef = useRef(null);
  const currentPwdRef = useRef(null);
  const pwdRef = useRef(null);
  const confirmPwdRef = useRef(null);

  const handleSave = async () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First Name is required";
    if (!lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else {
      const e = validators.email(email || "");
      if (e) newErrors.email = e;
    }

    if (!mobile.trim()) {
      newErrors.mobile = "Mobile Number is required";
    }

    if (password.trim()) {
      const pErr = validators.password(password);
      if (pErr) newErrors.password = pErr;
      if (!currentPassword.trim()) newErrors.currentPassword = "Old Password is required";
      if (!confirmPassword.trim()) newErrors.confirmPassword = "Confirm Password is required";
      if (password && confirmPassword && password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.firstName && firstRef.current) firstRef.current.focus();
      else if (newErrors.lastName && lastRef.current) lastRef.current.focus();
      else if (newErrors.mobile && mobileRef.current) mobileRef.current.focus();
      else if (newErrors.email && emailRef.current) emailRef.current.focus();
      else if (newErrors.currentPassword && currentPwdRef.current) currentPwdRef.current.focus();
      else if (newErrors.password && pwdRef.current) pwdRef.current.focus();
      else if (newErrors.confirmPassword && confirmPwdRef.current) confirmPwdRef.current.focus();
      return;
    }

    const updated = updateAuthSession({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim() || session?.name,
    });

    if (password.trim()) {
      setMessage("Updating password...");
      const result = await changePassword(currentPassword, password);
      if (!result.success) {
        setMessage(result.message || "Password update failed.");
        return;
      }
    }

    if (updated) {
      setMessage("Profile saved successfully.");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-yellow-400/20 bg-slate-950/95 p-8 shadow-[0_35px_120px_-30px_rgba(250,204,21,0.45)] backdrop-blur-sm">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-yellow-300/80">Profile</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Edit your profile</h1>
              <p className="mt-3 text-slate-300">Update the displayed name shown across the app.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/welcome")}
                className="rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-yellow-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={firstRef}
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={errors.firstName}
                  showErrorInPlaceholder={true}
                />
              </div>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={lastRef}
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={errors.lastName}
                  showErrorInPlaceholder={true}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={mobileRef}
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  error={errors.mobile}
                  showErrorInPlaceholder={true}
                />
              </div>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={emailRef}
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={email}
                  readOnly
                  error={errors.email}
                  showErrorInPlaceholder={true}
                />
              </div>
            </div>
 <div className="grid gap-6 sm:grid-cols-1">
              <div className="relative sm:col-span-1">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={currentPwdRef}
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  placeholder="Old Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  error={errors.currentPassword}
                  showErrorInPlaceholder={true}
                />
              </div></div>
            <div className="grid gap-6 sm:grid-cols-2">
              
              <div className="relative sm:col-span-1">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={pwdRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  showErrorInPlaceholder={true}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/95">
                  {showPassword ? (<EyeSlashIcon className="h-6 w-6" />) : (<EyeIcon className="h-6 w-6" />)}
                </button>
              </div>
              <div className="relative sm:col-span-1">
                <QuestionMarkCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  ref={confirmPwdRef}
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  showErrorInPlaceholder={true}
                />
              </div>
            </div>

           

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-2xl bg-yellow-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
              >
                Save Profile
              </button>
              {message ? (
                <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
