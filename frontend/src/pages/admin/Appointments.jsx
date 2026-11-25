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
import { Trash2 } from "lucide-react";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    appointmentAPI
      .getAll(statusFilter ? { status: statusFilter } : {})
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const changeStatus = async (id, status) => {
    try {
      await appointmentAPI.update(id, { status });
      toast.success("Status updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await appointmentAPI.delete(confirmTarget.id);
      toast.success("Appointment deleted");
      setConfirmTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="All appointments across the hospital"
        action={
          <select
            className="input-field w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={[
              "Patient",
              "Doctor",
              "Date & Time",
              "Reason",
              "Status",
              "Actions",
            ]}
            isEmpty={appointments.length === 0}
            emptyMessage="No appointments found"
          >
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">
                  {a.patient?.user?.name || "—"}
                </td>
                <td className="table-cell">
                  <div>Dr. {a.doctor?.user?.name}</div>
                  <div className="text-xs text-gray-400">
                    {a.doctor?.specialization || ""}
                  </div>
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
                  <div className="flex items-center gap-3">
                    <select
                      className="input-field w-auto text-xs py-1"
                      value={a.status}
                      onChange={(e) => changeStatus(a.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setConfirmTarget(a)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        title="Delete this appointment?"
        message="This will permanently remove the appointment. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
