import { useEffect, useState } from "react";
import { reportAPI, appointmentAPI } from "../../services/api";
import {
  StatCard,
  LoadingSpinner,
  StatusBadge,
} from "../../components/common";
import { Calendar, FileText, Pill, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function PatientDashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportAPI.patientDashboard(), appointmentAPI.getAll()])
      .then(([s, a]) => {
        setStats(s.data);
        setAppointments(a.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          My Health Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here's your health overview.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Appointments"
          value={stats?.total_appointments ?? 0}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Medical Records"
          value={stats?.total_medical_records ?? 0}
          icon={FileText}
          color="teal"
        />
        <StatCard
          title="Prescriptions"
          value={stats?.total_prescriptions ?? 0}
          icon={Pill}
          color="purple"
        />
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Appointment</p>
            {stats?.next_appointment ? (
              <p className="text-sm font-bold text-gray-900">
                {format(
                  new Date(stats.next_appointment.appointment_date),
                  "dd MMM",
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400">None scheduled</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/patient/book"
          className="card hover:shadow-md transition-shadow border-dashed border-blue-200 text-center cursor-pointer hover:border-blue-400"
        >
          <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-900 text-sm">
            Book Appointment
          </p>
          <p className="text-xs text-gray-400 mt-1">Schedule with a doctor</p>
        </Link>
        <Link
          to="/patient/records"
          className="card hover:shadow-md transition-shadow border-dashed border-teal-200 text-center cursor-pointer hover:border-teal-400"
        >
          <FileText className="w-8 h-8 text-teal-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-900 text-sm">Medical Records</p>
          <p className="text-xs text-gray-400 mt-1">View your health history</p>
        </Link>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Appointments
          </h2>
          <Link
            to="/patient/appointments"
            className="text-blue-600 text-xs hover:underline"
          >
            View all
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No appointments yet.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.doctor?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.doctor?.specialization || "General"} —{" "}
                    {a.reason || "Consultation"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {a.appointment_date
                      ? format(new Date(a.appointment_date), "dd MMM, HH:mm")
                      : "—"}
                  </p>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
