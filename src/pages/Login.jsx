import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, loginUser } from "../utils/auth";
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/welcome" replace />;
  }

  const nextPath = location.state?.from?.pathname || "/welcome";

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

    const result = await loginUser({
      email,
      password,
      rememberMe,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({
        password: result.message || "Invalid email or password",
      });
      return;
    }

    navigate(nextPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#001f5c]  flex items-center justify-center p-4">
      <div className="w-full max-w-8xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex">
        <div className="min-h-screen flex overflow-hidden">
          <div className="hidden md:block w-3/5 relative">
            <img
              src="src/assets/human-hill.jpg"
              alt="Leadership"
              className="w-full h-full object-cover"
            />
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

          <div className="w-full md:w-2/5 bg-gradient-to-br from-[#001a57] via-[#002a7f] to-[#00114a] flex justify-center pt-12 p-8">
            <div className="w-full max-w-lg mx-auto -mt-8">
              <h1 className="text-center text-white font-serif text-2xl md:text-lg drop-shadow-md">
                Leadership <span className="text-yellow-300"> Assessment </span>
              </h1>

              <div className="w-full h-px bg-white/20 my-4"></div>

              <p className="text-center text-yellow-300 italic text-3lg font-serif mb-8">
                Elevate. Empower. Excel.
              </p>

              <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,215,0,0.25)]">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-4 h-6 w-6 text-yellow-400" />

                      <input type="email"
                        value={email}
                        placeholder={errors.email ? errors.email : "Username"}
                        onChange={(e) => {
                          setEmail(e.target.value);

                          setErrors((prev) => ({
                            ...prev,
                            email: "",
                          }));
                        }}
                        className={`w-full bg-[#405181] rounded-xl py-4 pl-14 pr-4 text-white focus:outline-none focus:ring-2 ${errors.email
                          ? "border-2 border-red-500 placeholder-red-400 focus:ring-red-500"
                          : "border border-gray-400 placeholder-gray-200 focus:ring-yellow-400"
                          }`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-4 top-4 h-6 w-6 text-yellow-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder={errors.password ? errors.password : "Password"}
                        onChange={(e) => {
                          setPassword(e.target.value);

                          setErrors((prev) => ({
                            ...prev,
                            password: "",
                          }));
                        }}
                        className={`w-full bg-[#405181] rounded-xl py-4 pl-14 pr-14 text-white
                              focus:outline-none focus:ring-2
                              ${errors.password
                            ? "border-2 border-red-500 placeholder-red-400 focus:ring-red-500"
                            : "border border-gray-400 placeholder-gray-200 focus:ring-yellow-400"
                          }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-white"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-6 w-6" />
                        ) : (
                          <EyeIcon className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-gray-200 text-sm">Keep me signed in</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-50 mx-auto block  py-2 rounded-lg text-2lg font-serif text-black bg-gradient-to-b from-yellow-300
                   to-yellow-400 text-center"
                  >
                    {isSubmitting ? "Signing in..." : "Begin Journey"}
                  </button>
                </form>

                <div className="border-t border-white/20 mt-8 pt-6">
                  <p className="text-center text-yellow-300 italic text-lg font-serif mb-8">
                    Unlock Your Leadership Potential
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}