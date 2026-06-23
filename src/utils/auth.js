const AUTH_STORAGE_KEY = "gspoc_auth_session";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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

export async function loginUser({ email, password, rememberMe = false }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        rememberMe,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success || !data?.data?.token) {
      return {
        success: false,
        message: data?.message || data?.error || "Invalid email or password.",
      };
    }

    const session = {
      token: data.data.token,
      id: data.data.user?.id,
      name: data.data.user?.name,
      email: data.data.user?.email,
      role: data.data.user?.role,
      expiresAt: data.data.expiresAt,
      rememberMe,
      loggedInAt: new Date().toISOString(),
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
