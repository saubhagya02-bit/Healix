import { useEffect, useState } from "react";
import { appointmentAPI, recordAPI, patientAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  StatusBadge,
  Modal,
  FormField,
} from "../../components/common";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ClipboardList, Plus } from "lucide-react";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({
    diagnosis: "",
    treatment: "",
    notes: "",
    follow_up_date: "",
  });
  const [prescriptions, setPrescriptions] = useState([
    {
      medicine_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);
  const [saving, setSaving] = useState(false);

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

  const openRecord = (appt) => {
    setSelected(appt);
    setShowRecord(true);
    setForm({ diagnosis: "", treatment: "", notes: "", follow_up_date: "" });
    setPrescriptions([
      {
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await recordAPI.create({
        patient_id: selected.patient_id,
        appointment_id: selected.id,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        notes: form.notes,
        follow_up_date: form.follow_up_date || null,
        prescriptions: prescriptions.filter((p) => p.medicine_name.trim()),
      });
      // Mark appointment as completed
      await appointmentAPI.update(selected.id, { status: "completed" });
      toast.success("Medical record saved");
      setShowRecord(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const addPrescription = () =>
    setPrescriptions((p) => [
      ...p,
      {
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);

  const updateRx = (idx, key, value) =>
    setPrescriptions((prev) =>
      prev.map((rx, i) => (i === idx ? { ...rx, [key]: value } : rx)),
    );

  return (
    <div>
      <PageHeader
        title="My Appointments"
        subtitle="Patient appointments and consultations"
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={["Patient", "Date & Time", "Reason", "Status", "Actions"]}
            isEmpty={appointments.length === 0}
            emptyMessage="No appointments"
          >
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="font-medium text-gray-900">
                    {a.patient?.user?.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {a.patient?.blood_group}
                  </div>
                </td>
                <td className="table-cell">
                  {a.appointment_date
                    ? format(new Date(a.appointment_date), "dd MMM yyyy, HH:mm")
                    : "—"}
                </td>
                <td className="table-cell text-gray-500">{a.reason || "—"}</td>
                <td className="table-cell">
                  <StatusBadge status={a.status} />
                </td>
                <td className="table-cell">
                  {a.status !== "completed" && a.status !== "cancelled" && (
                    <button
                      onClick={() => openRecord(a)}
                      className="btn-primary flex items-center gap-1 text-xs py-1"
                    >
                      <ClipboardList className="w-3 h-3" /> Add Record
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Medical Record Modal */}
      <Modal
        isOpen={showRecord}
        onClose={() => setShowRecord(false)}
        title="Add Medical Record"
        size="xl"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            Patient: <strong>{selected?.patient?.user?.name}</strong>
          </p>

          <FormField label="Diagnosis" required>
            <textarea
              className="input-field"
              rows={2}
              value={form.diagnosis}
              onChange={(e) =>
                setForm((f) => ({ ...f, diagnosis: e.target.value }))
              }
              required
            />
          </FormField>
          <FormField label="Treatment Plan">
            <textarea
              className="input-field"
              rows={2}
              value={form.treatment}
              onChange={(e) =>
                setForm((f) => ({ ...f, treatment: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Clinical Notes">
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Follow-up Date">
            <input
              type="date"
              className="input-field"
              value={form.follow_up_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, follow_up_date: e.target.value }))
              }
            />
          </FormField>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Prescriptions
              </h3>
              <button
                type="button"
                onClick={addPrescription}
                className="text-blue-600 text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Medicine
              </button>
            </div>
            {prescriptions.map((rx, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded-lg"
              >
                <FormField label="Medicine Name">
                  <input
                    className="input-field text-xs"
                    placeholder="e.g. Paracetamol"
                    value={rx.medicine_name}
                    onChange={(e) =>
                      updateRx(i, "medicine_name", e.target.value)
                    }
                  />
                </FormField>
                <FormField label="Dosage">
                  <input
                    className="input-field text-xs"
                    placeholder="e.g. 500mg"
                    value={rx.dosage}
                    onChange={(e) => updateRx(i, "dosage", e.target.value)}
                  />
                </FormField>
                <FormField label="Frequency">
                  <input
                    className="input-field text-xs"
                    placeholder="e.g. Twice daily"
                    value={rx.frequency}
                    onChange={(e) => updateRx(i, "frequency", e.target.value)}
                  />
                </FormField>
                <FormField label="Duration">
                  <input
                    className="input-field text-xs"
                    placeholder="e.g. 7 days"
                    value={rx.duration}
                    onChange={(e) => updateRx(i, "duration", e.target.value)}
                  />
                </FormField>
                <div className="col-span-2">
                  <FormField label="Instructions">
                    <input
                      className="input-field text-xs"
                      placeholder="e.g. Take with food"
                      value={rx.instructions}
                      onChange={(e) =>
                        updateRx(i, "instructions", e.target.value)
                      }
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRecord(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Record & Complete"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
