import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import { LoadingSpinner } from "./components/common";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDoctors from "./pages/admin/Doctors";
import AdminPatients from "./pages/admin/Patients";
import AdminAppointments from "./pages/admin/Appointments";
import AdminDepartments from "./pages/admin/Departments";
import AdminReports from "./pages/admin/Reports";
import AdminUsers from "./pages/admin/Users";

// Doctor pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorRecords from "./pages/doctor/Records";
import DoctorProfile from "./pages/doctor/Profile";

// Patient pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientAppointments from "./pages/patient/Appointments";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientRecords from "./pages/patient/Records";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientProfile from "./pages/patient/Profile";

// Route Guards

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

// App

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="records" element={<DoctorRecords />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Patient */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="records" element={<PatientRecords />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
