import { useEffect, useState } from "react";
import { reportAPI, appointmentAPI } from "../../services/api";
import {
  StatCard,
  LoadingSpinner,
  StatusBadge,
} from "../../components/common";
import { Users, Calendar, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportAPI.doctorDashboard(),
      appointmentAPI.getAll({ status: "pending" }),
    ])
      .then(([s, a]) => {
        setStats(s.data);
        setUpcoming(a.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your schedule and patient overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Today's Patients"
          value={stats?.today_patients ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Upcoming"
          value={stats?.upcoming_appointments ?? 0}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Completed"
          value={stats?.completed_consultations ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Records Created"
          value={stats?.total_records_created ?? 0}
          icon={FileText}
          color="teal"
        />
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Upcoming Appointments
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No upcoming appointments
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.patient?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.reason || "General consultation"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
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
