import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Login from "../pages/Login.jsx";
import Welcome from "../pages/Welcome.jsx";
import Diagnostic from "../pages/Diagnostic.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Profile from "../pages/Profile.jsx";
import RoleGuard from "../component/RoleGuard.jsx";
import { getDefaultAuthenticatedPath, isAuthenticated } from "../utils/auth";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? getDefaultAuthenticatedPath() : "/login"} replace />;
}

const AppRoutes = () => {
  return (
      <Routes>

        <Route path="/" element={<RootRedirect />} />

        <Route path="/login" element={<Login />} />

        <Route path="/welcome" element={ <ProtectedRoute> <Welcome />  </ProtectedRoute>    }   />

        <Route path="/diagnostic" element={ <ProtectedRoute> <Diagnostic /> </ProtectedRoute> }  />

        <Route path="/profile" element={ <ProtectedRoute> <Profile /> </ProtectedRoute> } />

        <Route path="/dashboard"  element={<RoleGuard allowedRoles={["admin"]}> <Dashboard /> </RoleGuard> } />

        <Route path="*" element={<RootRedirect />} />

      </Routes>
  );
};

export default AppRoutes;