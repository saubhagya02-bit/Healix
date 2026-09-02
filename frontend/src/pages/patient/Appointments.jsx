import { useEffect, useState } from "react";
import { appointmentAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  StatusBadge,
} from "../../components/common";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    appointmentAPI
      .getAll()
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await appointmentAPI.cancel(id);
      toast.success("Appointment cancelled");
      load();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  return (
    <div>
      <PageHeader
        title="My Appointments"
        subtitle="View and manage your appointments"
        action={
          <Link
            to="/patient/book"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </Link>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={[
              "Doctor",
              "Specialization",
              "Date & Time",
              "Reason",
              "Status",
              "Actions",
            ]}
            isEmpty={appointments.length === 0}
            emptyMessage="No appointments yet. Book your first appointment!"
          >
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">
                  Dr. {a.doctor?.user?.name}
                </td>
                <td className="table-cell text-gray-500 text-xs">
                  {a.doctor?.specialization || "—"}
                </td>
                <td className="table-cell text-xs">
                  {a.appointment_date
                    ? format(new Date(a.appointment_date), "dd MMM yyyy, HH:mm")
                    : "—"}
                </td>
                <td className="table-cell text-gray-500">{a.reason || "—"}</td>
                <td className="table-cell">
                  <StatusBadge status={a.status} />
                </td>
                <td className="table-cell">
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <button
                      onClick={() => handleCancel(a.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
