import { useEffect, useState } from "react";
import {
  doctorAPI,
  departmentAPI,
  appointmentAPI,
} from "../../services/api";
import {
  PageHeader,
  LoadingSpinner,
  FormField,
} from "../../components/common";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User, Stethoscope } from "lucide-react";

export default function BookAppointment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([departmentAPI.getAll(), doctorAPI.getAll()])
      .then(([d, doc]) => {
        setDepartments(d.data);
        setDoctors(doc.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = selectedDept
    ? doctors.filter((d) => d.department_id === parseInt(selectedDept))
    : doctors;

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setForm((f) => ({ ...f, doctor_id: doctor.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor_id) return toast.error("Please select a doctor");
    if (!form.appointment_date || !form.appointment_time)
      return toast.error("Please select date and time");

    const appointmentDatetime = `${form.appointment_date}T${form.appointment_time}:00`;

    setSubmitting(true);
    try {
      await appointmentAPI.create({
        doctor_id: parseInt(form.doctor_id),
        appointment_date: appointmentDatetime,
        reason: form.reason,
        notes: form.notes,
      });
      toast.success("Appointment booked successfully!");
      navigate("/patient/appointments");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate time slots
  const timeSlots = [];
  if (selectedDoctor) {
    const [startH] = (selectedDoctor.start_time || "09:00")
      .split(":")
      .map(Number);
    const [endH] = (selectedDoctor.end_time || "17:00").split(":").map(Number);
    for (let h = startH; h < endH; h++) {
      timeSlots.push(`${String(h).padStart(2, "0")}:00`);
      timeSlots.push(`${String(h).padStart(2, "0")}:30`);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Book Appointment"
        subtitle="Schedule a consultation with a doctor"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Doctor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Department Filter */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              Step 1: Select a Doctor
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Department
              </label>
              <select
                className="input-field"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedDoctor(null);
                  setForm((f) => ({ ...f, doctor_id: "" }));
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDoctorSelect(doc)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedDoctor?.id === doc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-700">
                        {doc.user?.name?.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {doc.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.specialization}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        Rs. {doc.consultation_fee}
                      </p>
                    </div>
                  </div>
                  {doc.department?.name && (
                    <span className="mt-2 inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {doc.department.name}
                    </span>
                  )}
                </div>
              ))}
              {filteredDoctors.length === 0 && (
                <p className="text-gray-400 text-sm col-span-2 text-center py-4">
                  No doctors available
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Date & Time */}
          {selectedDoctor && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Step 2: Select Date & Time
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Date" required>
                  <input
                    type="date"
                    className="input-field"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.appointment_date}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        appointment_date: e.target.value,
                      }))
                    }
                    required
                  />
                </FormField>
                <FormField label="Time Slot">
                  <select
                    className="input-field"
                    value={form.appointment_time}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        appointment_time: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Available: {selectedDoctor.available_days} |{" "}
                {selectedDoctor.start_time} – {selectedDoctor.end_time}
              </p>
            </div>
          )}

          {/* Step 3: Reason */}
          {selectedDoctor && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Step 3: Reason for Visit
              </h3>
              <FormField label="Reason">
                <input
                  className="input-field"
                  placeholder="e.g. Chest pain, Follow-up, Routine checkup"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                />
              </FormField>
              <div className="mt-3">
                <FormField label="Additional Notes">
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Any additional information for the doctor..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        {/* Booking Summary */}
        <div>
          <div className="card sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Booking Summary
            </h3>
            {!selectedDoctor ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Select a doctor to see summary
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-900">
                    {selectedDoctor.user?.name}
                  </p>
                  <p className="text-blue-700 text-xs">
                    {selectedDoctor.specialization}
                  </p>
                </div>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span>{selectedDoctor.department?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span>{form.appointment_date || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span>{form.appointment_time || "—"}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Consultation Fee:</span>
                    <span className="text-green-600">
                      Rs. {selectedDoctor.consultation_fee}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !form.appointment_date ||
                    !form.appointment_time
                  }
                  className="btn-primary w-full mt-4"
                >
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
