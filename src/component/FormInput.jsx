import { forwardRef } from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const FormInput = forwardRef(function FormInput({
  error,
  value,
  showErrorInPlaceholder = false,
  ...props
}, ref) {
  const isValid = value?.trim() && !error;
  const autofillOverride = {
    WebkitBoxShadow: "0 0 0 1000px rgba(15, 23, 42, 0.92) inset",
    WebkitTextFillColor: "#f8fafc",
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        placeholder={
          showErrorInPlaceholder && error
            ? error
            : props.placeholder
        }
        style={autofillOverride}
        className={`w-full rounded-2xl border bg-slate-900/90 py-4 pl-12 pr-16 text-base text-white placeholder:text-slate-400 transition duration-150 ease-in-out
        focus:outline-none focus:ring-2
        ${
          error
            ? "border-red-500 placeholder-red-300/90 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-700/80 focus:border-yellow-300/80 focus:ring-yellow-300/20"
        }`}
      />

      {!showErrorInPlaceholder && error && (
        <p className="text-red-400 text-sm mt-1">
          {error}
        </p>
      )}

         {error && (
        <XCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
      )}

      {isValid && (
        <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500" />
      )}
    </div>
  );
});

export default FormInput;
