import { useEffect, useState } from "react";
import { reportAPI } from "../../services/api";
import { LoadingSpinner, StatCard } from "../../components/common";
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
import { Users, UserCheck, TrendingUp } from "lucide-react";

const COLORS = ["#3b82f6", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminReports() {
  const [monthly, setMonthly] = useState([]);
  const [patientStats, setPatientStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportAPI.monthlyAppointments(),
      reportAPI.patientStats(),
      reportAPI.appointmentsByDept(),
    ])
      .then(([m, p, d]) => {
        setMonthly(m.data);
        setPatientStats(p.data);
        setDeptData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const genderData = patientStats
    ? [
        { name: "Male", value: patientStats.male },
        { name: "Female", value: patientStats.female },
        { name: "Other", value: patientStats.other },
      ].filter((g) => g.value > 0)
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Healthcare statistics and insights
        </p>
      </div>

      {/* Patient Stats */}
      {patientStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Patients"
            value={patientStats.total}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Male"
            value={patientStats.male}
            icon={UserCheck}
            color="teal"
          />
          <StatCard
            title="Female"
            value={patientStats.female}
            icon={UserCheck}
            color="purple"
          />
          <StatCard
            title="New This Month"
            value={patientStats.new_this_month}
            icon={TrendingUp}
            color="green"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Appointments Bar Chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Monthly Appointments ({new Date().getFullYear()})
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
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

        {/* Gender Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Patient Gender Distribution
          </h2>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>

        {/* By Department */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Appointments by Department
          </h2>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="department"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#14b8a6"
                  radius={[0, 4, 4, 0]}
                  name="Appointments"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
