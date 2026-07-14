const AUTH_STORAGE_KEY = "gspoc_auth_session";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://leadership-assesment.onrender.com"
    : "http://localhost:5000");

export function getDefaultAuthenticatedPathForRole(role) {
  return String(role || "").trim().toLowerCase() === "admin" ? "/dashboard" : "/welcome";
}

export function getUserRole() {
  return String(getAuthSession()?.role || "").trim().toLowerCase();
}

export function getDefaultAuthenticatedPath() {
  return getDefaultAuthenticatedPathForRole(getUserRole());
}

export function isAuthenticated() {
  const session = getAuthSession();
  if (!session?.token || !session?.expiresAt) return false;

  if (Date.now() > Number(session.expiresAt)) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return false;
  }
  return true;
}

export function getAuthSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return getAuthSession()?.token || null;
}

export function setAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function updateAuthSession(patch) {
  const session = getAuthSession();
  if (!session) return null;
  const updated = { ...session, ...patch };
  setAuthSession(updated);
  return updated;
}

export async function loginUser({ identifier, email, password, rememberMe = false }) {
  try {
    const loginId = String(identifier || email || "").trim();

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: loginId,
        email: loginId,
        mobile: loginId,
        password,
        rememberMe,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success || !data?.data?.token) {
      return {
        success: false,
        message: data?.message || data?.error || "Invalid credentials.",
      };
    }

    const user = data.data.user || {};
    const firstName = user.firstname || user.firstName || "";
    const lastName = user.lastname || user.lastName || "";
    const fullName = user.name || `${firstName} ${lastName}`.trim() || user.email || "";

    const session = {
      token: data.data.token,
      expiresAt: data.data.expiresAt,
      rememberMe,
      loggedInAt: new Date().toISOString(),
      id: user.id,
      role: user.role,
      email: user.email,
      name: fullName,
      firstName,
      lastName,
      mobile: user.mobile || user.phone || user.phoneNumber || "",
      user,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

    return { success: true, session, message: "Login successful." };
  } catch {

    return { success: false, message: "Unable to reach backend server.", };
  }
}

export async function registerUser(registerForm) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerForm),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return {
        success: false,
        message: data?.message || "Registration failed",
      };
    }

    return {success: true, data, message: "Registration successful."};
  } catch (error) {
    return {success: false, message: "Unable to reach backend server", };
  }
}

export async function createAdminUser(payload) {
  try {
    const response = await authFetch("/api/auth/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return {
        success: false,
        message: data?.message || "Unable to create admin user.",
      };
    }

    return {
      success: true,
      message: data?.message || "Admin user created successfully.",
      data: data?.data || null,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Unable to reach backend server.",
    };
  }
}

export async function logoutUser() {
  const token = getAuthToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Best-effort logout. Local cleanup still applies.
    }
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function authFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response;
}

export async function fetchAuthProfile() {
  try {
    const response = await authFetch("/api/auth/me", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    // Some browsers can surface cached 304 responses with empty bodies.
    // In that case, use whatever session profile we already have.
    if (response.status === 304) {
      const session = getAuthSession();
      const profile = session?.user || session || {};
      return { success: true, profile };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      const session = getAuthSession();
      const profile = session?.user || session || null;
      if (profile) return { success: true, profile };
      return { success: false, message: data?.message || "Unable to fetch profile." };
    }

    return { success: true, profile: data?.data?.user || data.data || {} };
  } catch (error) {
    const session = getAuthSession();
    const profile = session?.user || session || null;
    if (profile) return { success: true, profile };
    return { success: false, message: error.message || "Unable to fetch profile." };
  }
}

export async function updateAuthProfile(payload) {
  try {
    const response = await authFetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return { success: false, message: data?.message || "Unable to update profile." };
    }

    return { success: true, message: data.message || "Profile updated.", user: data?.data?.user || null };
  } catch (error) {
    return { success: false, message: error.message || "Unable to update profile." };
  }
}

// Diagnostic API functions
export async function getQuestions() {
  try {
    const response = await authFetch("/api/questions");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error loading questions:", error);
    return {
      success: false,
      error: error.message || "Could not load questions. Please try again."
    };
  }
}

export async function submitDiagnostic(payload) {
  try {
    const response = await authFetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      const json = await response.json().catch(() => null);

      if (!response.ok && json?.alreadySubmitted) {
        return {
          success: false,
          alreadySubmitted: true,
          message: json?.message || "Assessment already submitted.",
          data: json?.data || null,
        };
      }

      if (!response.ok || json?.success === false) {
        return {
          success: false,
          message: json?.message || "Save failed.",
        };
      }

      return {
        success: true,
        message: json?.message || "Saved to Google Sheet!",
        data: json?.data || null,
      };
    }

    const text = await response.text();
    const normalized = String(text || "").trim().toLowerCase();
    const success =
      normalized === "success" ||
      normalized.includes("success") ||
      normalized.includes("saved") ||
      normalized.includes("updated");

    if (success) {
      return { success: true, message: "Saved to Google Sheet!" };
    } else {
      return { success: false, message: text || "Save failed." };
    }
  } catch (error) {
    console.error("Error submitting diagnostic:", error);
    return { success: false, message: "Network error." };
  }
}

export async function getDiagnosticSubmissionStatus() {
  try {
    const response = await authFetch("/api/submission-status", {
      method: "GET",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return {
        success: false,
        submitted: false,
        message: data?.message || "Unable to fetch submission status.",
      };
    }

    return {
      success: true,
      submitted: Boolean(data?.submitted),
      data: data?.data || null,
    };
  } catch (error) {
    return {
      success: false,
      submitted: false,
      message: error.message || "Unable to fetch submission status.",
    };
  }
}

export async function saveDiagnosticDraft(payload) {
  try {
    const response = await authFetch("/api/draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      return { success: false, message: data?.message || "Unable to save draft." };
    }

    return { success: true, message: data.message || "Draft saved.", data: data.data };
  } catch (error) {
    return { success: false, message: error.message || "Network error." };
  }
}

export async function loadDiagnosticDraft() {
  try {
    const response = await authFetch("/api/draft");
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return { success: false, message: data?.message || "No draft found." };
    }

    return { success: true, data: data.data };
  } catch (error) {
    return { success: false, message: error.message || "Unable to load draft." };
  }
}

export async function clearDiagnosticDraft() {
  try {
    const response = await authFetch("/api/draft", {
      method: "DELETE",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return { success: false, message: data?.message || "Unable to clear draft." };
    }

    return { success: true, message: data.message || "Draft cleared." };
  } catch (error) {
    return { success: false, message: error.message || "Unable to clear draft." };
  }
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await authFetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) return { success: false, message: data?.message || "Unable to change password" };
    return { success: true, message: data?.message || "Password changed" };
  } catch (error) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function requestPasswordReset({ email, newPassword }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(newPassword || "");

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail, newPassword: normalizedPassword }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || "Unable to reset password.",
      };
    }

    return {
      success: true,
      message: data?.message || "Password updated successfully.",
    };
  } catch {
    return {
      success: false,
      message: "Unable to reach backend server.",
    };
  }
}


export async function uploadFile(payload) {
  try {
    const response = await authFetch("/api/auth/upload", {
      method: "POST",
      headers: {
      },
      body: payload,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      return { success: false, message: data?.message || "Unable to save file." };
    }

    return { success: true, message: data.message || "File uploaded successfully.", data: data.data };
  } catch (error) {
    return { success: false, message: error.message || "Network error." };
  }
}
