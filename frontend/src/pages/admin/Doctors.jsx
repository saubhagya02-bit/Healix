import { useEffect, useState } from "react";
import { doctorAPI, departmentAPI, userAPI, authAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  Modal,
  FormField,
  ConfirmDialog,
} from "../../components/common";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "doctor123",
    specialization: "",
    license_no: "",
    department_id: "",
    qualification: "",
    experience_years: 0,
    consultation_fee: 500,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([doctorAPI.getAll(), departmentAPI.getAll()])
      .then(([d, dept]) => {
        setDoctors(d.data);
        setDepartments(dept.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Create user
      const userRes = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "doctor",
      });
      // 2. Create doctor profile
      await doctorAPI.create({
        user_id: userRes.data.id,
        specialization: form.specialization,
        license_no: form.license_no,
        department_id: parseInt(form.department_id) || null,
        qualification: form.qualification,
        experience_years: parseInt(form.experience_years),
        consultation_fee: parseFloat(form.consultation_fee),
      });
      toast.success("Doctor created successfully");
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create doctor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await doctorAPI.delete(confirmTarget.id);
      toast.success("Doctor deleted");
      setConfirmTarget(null);
      load();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Manage medical staff"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={[
              "Name",
              "Specialization",
              "Department",
              "License",
              "Experience",
              "Fee",
              "Actions",
            ]}
            isEmpty={doctors.length === 0}
            emptyMessage="No doctors found"
          >
            {doctors.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="font-medium text-gray-900">
                    {d.user?.name}
                  </div>
                  <div className="text-xs text-gray-400">{d.user?.email}</div>
                </td>
                <td className="table-cell">{d.specialization || "—"}</td>
                <td className="table-cell">{d.department?.name || "—"}</td>
                <td className="table-cell text-gray-500">
                  {d.license_no || "—"}
                </td>
                <td className="table-cell">{d.experience_years}y</td>
                <td className="table-cell">Rs. {d.consultation_fee}</td>
                <td className="table-cell">
                  <button
                    onClick={() => setConfirmTarget(d)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Create Doctor Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Doctor"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <input
                className="input-field"
                value={form.name}
                onChange={f("name")}
                required
              />
            </FormField>
            <FormField label="Email" required>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={f("email")}
                required
              />
            </FormField>
            <FormField label="Password" required>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={f("password")}
                required
              />
            </FormField>
            <FormField label="License No" required>
              <input
                className="input-field"
                value={form.license_no}
                onChange={f("license_no")}
                required
              />
            </FormField>
            <FormField label="Specialization">
              <input
                className="input-field"
                value={form.specialization}
                onChange={f("specialization")}
              />
            </FormField>
            <FormField label="Department">
              <select
                className="input-field"
                value={form.department_id}
                onChange={f("department_id")}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Qualification">
              <input
                className="input-field"
                value={form.qualification}
                onChange={f("qualification")}
              />
            </FormField>
            <FormField label="Experience (years)">
              <input
                type="number"
                className="input-field"
                value={form.experience_years}
                onChange={f("experience_years")}
              />
            </FormField>
            <FormField label="Consultation Fee (Rs.)">
              <input
                type="number"
                className="input-field"
                value={form.consultation_fee}
                onChange={f("consultation_fee")}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Create Doctor"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        title="Delete this doctor?"
        message={
          confirmTarget
            ? `Dr. ${confirmTarget.user?.name} will be permanently removed, including their doctor profile. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
