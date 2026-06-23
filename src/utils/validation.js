export const validators = {
  required: (value, fieldName) => !value?.trim() ? `${fieldName} is required` : "",

  email: (value) =>!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())
    ? "Enter a valid email address"
    : "",

  mobile: (value) =>!/^[6-9]\d{9}$/.test(value)
      ? "Enter a valid 10-digit mobile number"
      : "",

  password: (value) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return "Must contain uppercase, lowercase and number";
    }

    return "";
  },

  minLength: (value, length) =>
    value.length < length ? `Minimum ${length} characters required` : "",
};