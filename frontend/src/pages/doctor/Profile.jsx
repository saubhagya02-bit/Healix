import { useEffect, useState } from "react";
import { doctorAPI, departmentAPI } from "../../services/api";
import {
  PageHeader,
  LoadingSpinner,
  FormField,
} from "../../components/common";
import toast from "react-hot-toast";

export default function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    Promise.all([doctorAPI.getMe(), departmentAPI.getAll()])
      .then(([d, dept]) => {
        setDoctor(d.data);
        setDepartments(dept.data);
        setForm({
          specialization: d.data.specialization || "",
          qualification: d.data.qualification || "",
          experience_years: d.data.experience_years || 0,
          consultation_fee: d.data.consultation_fee || 0,
          available_days: d.data.available_days || "",
          start_time: d.data.start_time || "09:00",
          end_time: d.data.end_time || "17:00",
          department_id: d.data.department_id || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorAPI.updateMe({
        ...form,
        department_id: parseInt(form.department_id) || null,
      });
      toast.success("Profile updated");
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
        subtitle="Update your professional information"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="card text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-700">
              {doctor?.user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <h2 className="font-semibold text-gray-900">{doctor?.user?.name}</h2>
          <p className="text-sm text-gray-500">{doctor?.user?.email}</p>
          <div className="mt-4 text-sm">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {doctor?.specialization || "General Physician"}
            </span>
          </div>
          <div className="mt-4 text-left text-sm space-y-2 text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">License</span>
              <span className="font-mono text-xs">
                {doctor?.license_no || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Department</span>
              <span>{doctor?.department?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Experience</span>
              <span>{doctor?.experience_years} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee</span>
              <span className="font-semibold text-green-600">
                Rs. {doctor?.consultation_fee}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Edit Professional Details
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <FormField label="Available Days">
                <input
                  className="input-field"
                  value={form.available_days}
                  onChange={f("available_days")}
                  placeholder="Monday,Tuesday,Wednesday..."
                />
              </FormField>
              <FormField label="Start Time">
                <input
                  type="time"
                  className="input-field"
                  value={form.start_time}
                  onChange={f("start_time")}
                />
              </FormField>
              <FormField label="End Time">
                <input
                  type="time"
                  className="input-field"
                  value={form.end_time}
                  onChange={f("end_time")}
                />
              </FormField>
            </div>
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
