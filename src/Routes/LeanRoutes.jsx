import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Login from "../pages/Login.jsx";
import Welcome from "../pages/Welcome.jsx";
import Diagnostic from "../pages/Diagnostic.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import { isAuthenticated } from "../utils/auth";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? "/welcome" : "/login"} replace />;
}

const AppRoutes = () => {
  return (
      <Routes>

        <Route path="/" element={<RootRedirect />} />

        {/* Login Screen */}
        <Route path="/login" element={<Login />} />

        {/* Welcome Screen */}
        <Route  path="/welcome" element={ <ProtectedRoute>     <Welcome />   </ProtectedRoute>    }     />

        {/* Leadership Diagnostic */}
        <Route  path="/diagnostic" element={ <ProtectedRoute> <Diagnostic /> </ProtectedRoute>    }     />

        {/* Submissions Dashboard */}
        <Route
          path="/dashboard"  element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>   }     />

        <Route path="*" element={<RootRedirect />} />

      </Routes>
  );
};

export default AppRoutes;