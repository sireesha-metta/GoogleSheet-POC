import { useState } from "react";
import { validators } from "../../utils/validation";
import FormInput from "../FormInput";
import { User, Mail } from "lucide-react";

const createInitialForm = (initialData = {}) => ({
  firstName: initialData?.firstName || "",
  lastName: initialData?.lastName || "",
  email: initialData?.email || "",
});

const getFieldError = (field, value) => {
  const normalized = String(value || "").trim();

  switch (field) {
    case "firstName":
      return validators.required(normalized, "First Name");

    case "lastName":
      return validators.required(normalized, "Last Name");

    case "email":
      return (
        validators.required(normalized, "Email") ||
        validators.email(normalized)
      );

    default:
      return "";
  }
};

export default function UserDetails({ initialData, continueSaving, continueError, onContinue, onBack, }) {

  const [form, setForm] = useState(createInitialForm(initialData));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
    } else {
      const emailError = validators.email(form.email);
      if (emailError) errors.email = emailError;
    }
    return errors;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: getFieldError(field, value),
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: getFieldError(field, form[field]),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    const fields = ["firstName", "lastName", "email"];

    fields.forEach((field) => {
      const error = getFieldError(field, form[field]);

      if (error) {
        nextErrors[field] = error;
      }
    });

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onContinue(form);
    }
  };

  // const renderInput = (field, label, type = "text", placeholder) => {
  //   const fieldError = touched[field] ? errors[field] : "";
  //   return (
  //     <div>
  //       <label className="mb-2 block font-medium text-[#c8a85b]">{label}
  //         <span className="ml-1 text-red-500">*</span>
  //       </label>
  //       <FormInput type={type} value={form[field]} placeholder={placeholder} error={fieldError}
  //         showErrorInPlaceholder={true} onChange={(e) => handleChange(field, e.target.value)}
  //         onBlur={() => handleBlur(field)}
  //         className={`w-full rounded-2xl border bg-[#1c1c1c] px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 ${fieldError
  //           ? "border-red-500 focus:border-red-500"
  //           : "border-[#cd3cd3] focus:border-[#c8a85b]"
  //           }`}
  //       />
  //     </div>
  //   );
  // };


  const renderInput = (field, label, type = "text", placeholder, Icon) => {
    const fieldError = touched[field] ? errors[field] : "";
    return (
      <div>
        <label className="mb-2 block font-medium text-[#c8a85b]">
          {label}
          <span className="ml-1 text-red-500">*</span>
        </label>

        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c8a85b]"
            />
          )}

          <FormInput type={type} value={form[field]} placeholder={placeholder} error={fieldError} showErrorInPlaceholder={true}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            className={`w-full rounded-2xl border bg-[#1c1c1c] pl-12 pr-5 py-4text-white placeholder:text-gray-500 outline-none transition-all duration-300 ${fieldError
              ? "border-red-500 focus:border-red-500"
              : "border-[#cd3cd3] focus:border-[#c8a85b]"
              }`}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#1c1c1c]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full max-w-4xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">LEAN IN COACHING </p>
          <h1 className="text-3xl font-bold leading-tight text-[#c8a85b] md:text-3xl">Tell us about yourself </h1>
          <p className="mt-2 max-w-3xl text-md leading-8 text-gray-400">
            Please provide your basic information before beginning the
            Leadership Reset Diagnostic. Your assessment results will be
            emailed to you once completed.
          </p>

          <div className="mt-8 max-w-3xl rounded-2xl border border-[#cd3cd3] bg-[#262626] p-8">
            <div className="grid gap-6 md:grid-cols-2">
              {renderInput("firstName", "First Name", "text", "Enter First Name", User)}
              {renderInput("lastName", "Last Name", "text", "Enter Last Name", User)}
              <div className="md:col-span-2">
                {renderInput("email", "Email Address", "email", "Enter Email Address", Mail)}
              </div>
            </div>

            {continueError && (<div className="mt-6 rounded-xl border border-red-500 bg-red-950/30 p-4 text-red-300">{continueError}  </div>)}

            <div className="mt-8 flex justify-between">
              <button type="button" onClick={onBack} className="rounded-full border border-[#cd3cd3] bg-transparent px-8 py-4 font-semibold text-[#c8a85b] transition hover:bg-[#cd3cd3]/10">Back</button>

              <button type="button" onClick={validate} disabled={continueSaving} className="rounded-full border border-[#cd3cd3] bg-[#c8a85b] px-8 py-4 font-semibold text-[#1c1c1c] transition hover:opacity-90"      >
                {continueSaving ? "Saving..." : "Begin Assessment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}