import { useEffect, useState } from "react";
import { departmentAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  Modal,
  FormField,
  ConfirmDialog,
} from "../../components/common";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    departmentAPI
      .getAll()
      .then((r) => setDepartments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await departmentAPI.create(form);
      toast.success("Department created");
      setShowModal(false);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await departmentAPI.delete(confirmTarget.id);
      toast.success("Deleted");
      setConfirmTarget(null);
      load();
    } catch {
      toast.error("Cannot delete — doctors may be assigned");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage hospital departments"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={["Name", "Description", "Created", "Actions"]}
            isEmpty={departments.length === 0}
            emptyMessage="No departments yet"
          >
            {departments.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{d.name}</td>
                <td className="table-cell text-gray-500">
                  {d.description || "—"}
                </td>
                <td className="table-cell text-gray-400 text-xs">
                  {new Date(d.created_at).toLocaleDateString()}
                </td>
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Department"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Department Name" required>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="input-field"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        title="Delete this department?"
        message={
          confirmTarget
            ? `"${confirmTarget.name}" will be permanently removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
