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
        className={`w-full bg-[#405181] rounded-xl py-4 px-10  text-white
        focus:outline-none focus:ring-2
        ${
          error
            ? "border-2 border-red-500 placeholder-red-400 focus:ring-red-500"
            : "border border-gray-400 placeholder-gray-200 focus:ring-yellow-400"
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