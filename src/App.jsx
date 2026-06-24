
import { useEffect } from "react";
import AppRoutes from "./Routes/LeanRoutes.jsx";

export default function App() {
  useEffect(() => {
    // Clear expired auth sessions on app startup
    const AUTH_STORAGE_KEY = "gspoc_auth_session";
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (raw) {
      try {
        const session = JSON.parse(raw);
        // If token doesn't exist or session is expired, clear it
        if (!session?.token || !session?.expiresAt || Date.now() > Number(session.expiresAt)) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          console.log("Cleared expired session");
        }
      } catch {
        // If session data is corrupted, clear it
        localStorage.removeItem(AUTH_STORAGE_KEY);
        console.log("Cleared corrupted session");
      }
    }
  }, []);

  return <AppRoutes />;
}
 

