import { Outlet } from "react-router-dom";
import AuthHeader from "./AuthHeader";
import Sidebar from "./SideBar";
import Footer from "../pages/Footer";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;