import { useEffect, useState } from "react";
import { userAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  ConfirmDialog,
} from "../../components/common";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    userAPI
      .getAll(roleFilter ? { role: roleFilter } : {})
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [roleFilter]);

  const toggleActive = async (id) => {
    try {
      await userAPI.toggleActive(id);
      toast.success("User status updated");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const deleteUser = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await userAPI.delete(confirmTarget.id);
      toast.success("User deleted");
      setConfirmTarget(null);
      load();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const roleBadge = {
    admin: "bg-purple-100 text-purple-700",
    doctor: "bg-blue-100 text-blue-700",
    patient: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="All system users"
        action={
          <select
            className="input-field w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="patient">Patient</option>
          </select>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={["Name", "Email", "Role", "Status", "Created", "Actions"]}
            isEmpty={users.length === 0}
            emptyMessage="No users found"
          >
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-900">
                  {u.name}
                </td>
                <td className="table-cell text-gray-500">{u.email}</td>
                <td className="table-cell">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleBadge[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="table-cell text-xs text-gray-400">
                  {u.created_at
                    ? format(new Date(u.created_at), "dd MMM yyyy")
                    : "—"}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(u.id)}
                      className={
                        u.is_active
                          ? "text-green-500 hover:text-green-700"
                          : "text-gray-400 hover:text-gray-600"
                      }
                      title={u.is_active ? "Deactivate" : "Activate"}
                    >
                      {u.is_active ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmTarget(u)}
                      className="text-red-400 hover:text-red-600"
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
        onConfirm={deleteUser}
        title="Delete this user?"
        message={
          confirmTarget
            ? `${confirmTarget.name} (${confirmTarget.email}) will be permanently removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
