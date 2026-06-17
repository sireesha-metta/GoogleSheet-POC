import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "../Welcome.jsx";
import Diagnostic from "../Diagnostic.jsx";

const AppRoutes = () => {
  return (
      <Routes>

        {/* Welcome Screen */}
        <Route path="/" element={<Welcome />} />

        {/* Leadership Diagnostic */}
        <Route
          path="/diagnostic"   element={<Diagnostic />}   />

      </Routes>
  );
};

export default AppRoutes;