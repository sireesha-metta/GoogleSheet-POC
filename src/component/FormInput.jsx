import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default function FormInput({
  error,value,
  showErrorInPlaceholder = false,
  ...props
}) {
  const isValid = value?.trim() && !error;
  return (
    <div className="relative">
      <input
        {...props}
        placeholder={
          showErrorInPlaceholder && error
            ? error
            : props.placeholder
        }
        className={`w-full rounded-2xl border bg-[rgba(19,41,82,0.62)] py-4 pl-12 pr-12 text-xl text-white placeholder:text-slate-200/90
        focus:outline-none focus:ring-2
        ${
          error
            ? "border-red-500 placeholder-red-300/90 focus:ring-red-500"
            : "border-slate-300/50 focus:border-yellow-300/60 focus:ring-yellow-300/60"
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
}