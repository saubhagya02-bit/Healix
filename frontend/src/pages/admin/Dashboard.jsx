import { useEffect, useState } from "react";
import { reportAPI } from "../../services/api";
import { StatCard, LoadingSpinner } from "../../components/common";
import {
  Users,
  UserCog,
  Calendar,
  CheckCircle,
  Clock,
  Building2,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportAPI.adminDashboard(),
      reportAPI.monthlyAppointments(),
      reportAPI.appointmentsByDept(),
    ])
      .then(([s, m, d]) => {
        setStats(s.data);
        setMonthly(m.data);
        setDeptData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of healthcare operations
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Doctors"
          value={stats?.total_doctors ?? 0}
          icon={UserCog}
          color="teal"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.today_appointments ?? 0}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Pending Appointments"
          value={stats?.pending_appointments ?? 0}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Completed"
          value={stats?.completed_appointments ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Departments"
          value={stats?.total_departments ?? 0}
          icon={Building2}
          color="red"
        />
        <StatCard
          title="Total Appointments"
          value={stats?.total_appointments ?? 0}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={`Rs. ${(stats?.monthly_revenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Appointments */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Monthly Appointments
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Appointments"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Department */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Appointments by Department
          </h2>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
              No appointment data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
