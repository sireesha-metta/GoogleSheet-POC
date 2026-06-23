import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, loginUser, registerUser } from "../utils/auth";
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, QuestionMarkCircleIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { INITIAL_REGISTER_FORM, INITIAL_REGISTER_ERRORS, } from "../types/register.types";
import FormInput from "../component/FormInput";
import { validators } from "../utils/validation";

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
    <div className="min-h-screen bg-amber-300 flex items-center justify-center p-4">
      <div className="w-full max-w-8xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex">
        <div className="min-h-screen flex overflow-hidden">
          <div className="hidden md:block w-3/5 relative">
            <img src="src/assets/human-hill.jpg" alt="Leadership" className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/25"></div>

            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-8 text-white text-center">
              <p className="text-2xl md:text-2xl drop-shadow-md text-white font-serif italic font-medium">
                Lorraine@Leanin-Coaching.com
              </p>
              <h2 className="mt-3 text-2lg italic text-yellow-300 font-serif leading-tight">
                Awaken the Leader Within
              </h2>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
          </div>

          <div className="w-full md:w-2/5 bg-gradient-to-br from-[#334a80] via-[#3d5fa3] to-[#2a3d66] flex justify-center pt-12 p-8">
            <div className="w-full max-w-lg mx-auto -mt-6">
              <h1 className="text-center text-white font-serif text-2xl md:text-lg drop-shadow-md">
                Leadership <span className="text-yellow-300"> Assessment </span>
              </h1>

              {/* <div className="w-full h-px bg-white/20 my-4"></div> */}

              <p className="text-center text-yellow-300 italic text-3lg font-serif mb-6">
                Elevate. Empower. Excel.
              </p>

              <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,215,0,0.25)]">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />

                      <FormInput type="email" value={email} placeholder="Email" error={errors.email} showErrorInPlaceholder={true}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            email: "",
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                      <FormInput type={showPassword ? "text" : "password"} value={password} placeholder="Password"
                        error={errors.password} showErrorInPlaceholder={true}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            password: "",
                          }));
                        }}
                      />

                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 right-10 text-white" >
                        {showPassword ? (<EyeSlashIcon className="h-6 w-6" />) : (<EyeIcon className="h-6 w-6" />)}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2" />
                    <span className="text-gray-200 text-sm">Keep me signed in</span>
                    <span className="text-gray-200 ml-auto text-sm">Forgot Password?</span>
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-50 mx-auto block  py-2 rounded-lg text-2lg font-serif text-black bg-gradient-to-b from-yellow-300
                   to-yellow-400 text-center" >
                    {isSubmitting ? "Signing in..." : "Start Assessment"}
                  </button>
                </form>

                <div className="border-t border-white/20 mt-6 pt-4">
                  <p className="text-center text-yellow-300 italic text-lg font-serif mb-3">
                    Don't Have an Account?{" "}<button type="button" onClick={() => setShowRegister(true)}
                      className="underline font-semibold hover:text-yellow-200" >
                      Register Here
                    </button>
                  </p>

                  <p className="text-center text-white italic text-sm font-serif mb-4">
                    Unlock Your Leadership Potential
                  </p>
                </div>
              </div>
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

