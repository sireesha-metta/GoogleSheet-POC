import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "../Welcome.jsx";
import Diagnostic from "../Diagnostic.jsx";
import Dashboard from "../Dashboard.jsx";

const AppRoutes = () => {
  return (
      <Routes>

        {/* Welcome Screen */}
        <Route path="/" element={<Welcome />} />

        {/* Leadership Diagnostic */}
        <Route path="/diagnostic" element={<Diagnostic />} />

        {/* Submissions Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>
  );
};

export default AppRoutes;