import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, loginUser, registerUser } from "../utils/auth";
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, QuestionMarkCircleIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [registerForm, setRegisterForm] = useState(
    INITIAL_REGISTER_FORM
  );

  const [registerErrors, setRegisterErrors] = useState(
    INITIAL_REGISTER_ERRORS
  );

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/welcome", { replace: true });
    }
  }, [navigate]);

  const nextPath = location.state?.from?.pathname || "/welcome";

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


  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setErrors({});
    setIsSubmitting(true);

    const result = await loginUser({ email, password, rememberMe });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({
        password: result.message || "Invalid email or password",
      });
      return;
    }

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

    alert("Registration Successful");

    setRegisterForm(INITIAL_REGISTER_FORM);
    setShowRegister(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <img src={humanhill} alt="Leadership" className="absolute inset-0 h-full w-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-slate-950/80" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center justify-between gap-8 px-4            py-8 md:px-10 lg:px-14">
        <div className="hidden max-w-[420px] md:block">
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
              p-6 shadow-2xl backdrop-blur-md md:p-4">
            <h1 className="text-center font-serif text-2xl text-white md:text-2xl">
              Login <span className="text-yellow-200">Here</span>
            </h1>

            <div className="mx-auto mt-4 h-px w-56 bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent" />

            <h3 className="mt-4 text-center text-md text-slate-100/95 md:text-lg italic">
              Access your Leadership Assessment account
            </h3>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />

                <FormInput
                  type="email"
                  value={email}
                  placeholder="Email"
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
                  className="absolute right-4 top-4 text-white/95"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-6 w-6" />
                  ) : (
                    <EyeIcon className="h-6 w-6" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm md:text-base">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/60 bg-transparent text-blue-500 accent-blue-500"
                />

                <span className="text-slate-100">Keep me signed in</span>

                <button
                  type="button"
                  className="ml-auto text-yellow-300 transition hover:text-yellow-200"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 block w-full rounded-xl bg-gradient-to-b from-yellow-300 to-yellow-500 py-3 text-center text-3xl font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 md:text-4xl"
              >
                {isSubmitting ? "Signing in..." : "Start Assessment"}
              </button>
            </form>

            <div className="mt-7 border-t border-white/30 pt-5">
              <p className="text-center text-lg text-slate-100 md:text-xl">
                Don't Have an Account?{" "}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="font-semibold text-yellow-300 underline transition hover:text-yellow-200"
                >
                  Register Here
                </button>
              </p>

              <p className="mt-4 text-center font-serif text-2xl italic text-white/90 md:text-3xl">
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

                <FormInput type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={registerForm.password}
                  onChange={handleRegisterChange} error={registerErrors.password} showErrorInPlaceholder={true} />

                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 right-10 text-white" >
                  {showPassword ? (<EyeSlashIcon className="h-6 w-6" />) : (<EyeIcon className="h-6 w-6" />)}
                </button>
              </div>

              <div className="relative">
                <QuestionMarkCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />

                <FormInput type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password"
                  value={registerForm.confirmPassword} showErrorInPlaceholder={true}
                  onChange={handleRegisterChange} error={registerErrors.confirmPassword} />

                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 right-10 text-white" >
                  {showPassword ? (<EyeSlashIcon className="h-6 w-6" />) : (<EyeIcon className="h-6 w-6" />)}
                </button>

              </div>

            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setShowRegister(false)} className="px-6 py-2 rounded-lg bg-gray-500 text-white"  >
                Cancel
              </button>

              <button type="button" onClick={handleRegister}
                className="px-6 py-2 rounded-lg text-black font-semibold bg-gradient-to-b from-yellow-300 to-yellow-400" >
                Register
              </button>
            </div>

          </div>
        </div>
      )}


    </div>


  );
}

