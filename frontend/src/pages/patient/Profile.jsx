import { useEffect, useState } from "react";
import { patientAPI, userAPI } from "../../services/api";
import {
  PageHeader,
  LoadingSpinner,
  FormField,
} from "../../components/common";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function PatientProfile() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [userForm, setUserForm] = useState({ name: "" });

  useEffect(() => {
    patientAPI
      .getMe()
      .then((r) => {
        setPatient(r.data);
        setUserForm({ name: r.data.user?.name || "" });
        setForm({
          dob: r.data.dob || "",
          gender: r.data.gender || "",
          phone: r.data.phone || "",
          address: r.data.address || "",
          blood_group: r.data.blood_group || "",
          emergency_contact: r.data.emergency_contact || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientAPI.updateMe(form);
      if (userForm.name !== patient.user?.name) {
        await userAPI.update(user.id, userForm);
      }
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="card text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-blue-600">
              {patient?.user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <h2 className="font-bold text-gray-900">{patient?.user?.name}</h2>
          <p className="text-sm text-gray-500">{patient?.user?.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-left">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Blood Group</p>
              <p className="font-bold text-red-600 text-lg">
                {form.blood_group || "—"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Gender</p>
              <p className="font-semibold capitalize">{form.gender || "—"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <p className="text-xs text-gray-400">Date of Birth</p>
              <p className="font-semibold">{form.dob || "—"}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Edit Personal Information
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <FormField label="Full Name">
              <input
                className="input-field"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date of Birth">
                <input
                  type="date"
                  className="input-field"
                  value={form.dob}
                  onChange={f("dob")}
                />
              </FormField>
              <FormField label="Gender">
                <select
                  className="input-field"
                  value={form.gender}
                  onChange={f("gender")}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Phone Number">
                <input
                  className="input-field"
                  value={form.phone}
                  onChange={f("phone")}
                  placeholder="07XXXXXXXX"
                />
              </FormField>
              <FormField label="Blood Group">
                <select
                  className="input-field"
                  value={form.blood_group}
                  onChange={f("blood_group")}
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                    (bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ),
                  )}
                </select>
              </FormField>
            </div>

            <FormField label="Address">
              <textarea
                className="input-field"
                rows={2}
                value={form.address}
                onChange={f("address")}
                placeholder="Your home address"
              />
            </FormField>

            <FormField label="Emergency Contact">
              <input
                className="input-field"
                value={form.emergency_contact}
                onChange={f("emergency_contact")}
                placeholder="Emergency contact name & number"
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
