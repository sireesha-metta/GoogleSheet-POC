import { NavLink } from "react-router-dom";
// import { FaHome, FaUsers, FaUserShield } from "react-icons/fa";

const Sidebar = () => {
  const menuClass = ({ isActive }) => `flex items-center gap-3 px-5 py-3 rounded-lg transition 
                        ${isActive ? "bg-yellow-600 text-white" : "text-gray-200 hover:bg-slate-700"}`;

  return (
    <aside className="w-64 bg-slate-800 p-4">

      <nav className="space-y-2">

        <NavLink to="/dashboard" className={menuClass}> Dashboard </NavLink>
        
        <NavLink to="/admins" className={menuClass}>  Admins  </NavLink>

        <NavLink to="/respondents" className={menuClass}>  Respondents  </NavLink>

        <NavLink to="/dash-submissions" className={menuClass}> Submissions </NavLink>

        <NavLink to="/upload-file" className={menuClass}> Upload File </NavLink>

      </nav>

    </aside>
  );
};

export default Sidebar;