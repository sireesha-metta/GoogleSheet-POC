import { Navigate, useLocation } from "react-router-dom";
import { getDefaultAuthenticatedPath, getUserRole, isAuthenticated } from "../utils/auth";

export default function RoleGuard({ allowedRoles = [], children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = getUserRole();
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).trim().toLowerCase());

  if (!normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to={getDefaultAuthenticatedPath()} replace />;
  }

  return children;
}