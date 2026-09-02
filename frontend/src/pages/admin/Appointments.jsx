import { useEffect, useState } from "react";
import { appointmentAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  StatusBadge,
  ConfirmDialog,
} from "../../components/common";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancel = async () => {
    if (!confirmTarget) return;
    setCancelling(true);
    try {
      await appointmentAPI.cancel(confirmTarget.id);
      toast.success("Appointment cancelled");
      setConfirmTarget(null);
      load();
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setCancelling(false);
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
                      onClick={() => setConfirmTarget(a)}
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

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleCancel}
        title="Cancel this appointment?"
        message={
          confirmTarget
            ? `Your appointment with Dr. ${confirmTarget.doctor?.user?.name}${
                confirmTarget.appointment_date
                  ? ` on ${format(new Date(confirmTarget.appointment_date), "dd MMM yyyy, HH:mm")}`
                  : ""
              } will be cancelled.`
            : ""
        }
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        danger
        loading={cancelling}
      />
    </div>
  );
}
