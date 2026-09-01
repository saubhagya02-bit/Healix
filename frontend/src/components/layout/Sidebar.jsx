import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  FileText,
  Pill,
  Building2,
  BarChart3,
  LogOut,
  Activity,
} from "lucide-react";

const navByRole = {
  admin: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/doctors", icon: UserCog, label: "Doctors" },
    { to: "/admin/patients", icon: Users, label: "Patients" },
    { to: "/admin/departments", icon: Building2, label: "Departments" },
    { to: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { to: "/admin/reports", icon: BarChart3, label: "Reports" },
  ],
  doctor: [
    { to: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/doctor/appointments", icon: Calendar, label: "Appointments" },
    { to: "/doctor/patients", icon: Users, label: "My Patients" },
    { to: "/doctor/records", icon: FileText, label: "Medical Records" },
    { to: "/doctor/profile", icon: UserCog, label: "My Profile" },
  ],
  patient: [
    { to: "/patient", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/patient/appointments", icon: Calendar, label: "Appointments" },
    { to: "/patient/book", icon: Activity, label: "Book Appointment" },
    { to: "/patient/records", icon: FileText, label: "Medical Records" },
    { to: "/patient/prescriptions", icon: Pill, label: "Prescriptions" },
    { to: "/patient/profile", icon: UserCog, label: "My Profile" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Healix</h1>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split("/").length === 2}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
