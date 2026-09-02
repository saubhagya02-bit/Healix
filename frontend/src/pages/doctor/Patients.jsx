import { useEffect, useState } from "react";
import { recordAPI } from "../../services/api";
import { PageHeader, LoadingSpinner } from "../../components/common";
import { format } from "date-fns";

export default function DoctorPatients() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordAPI
      .getAll()
      .then((r) => setRecords(r.data))
      .finally(() => setLoading(false));
  }, []);

  // Deduplicate patients
  const patients = Object.values(
    records.reduce((acc, r) => {
      if (r.patient && !acc[r.patient_id]) {
        acc[r.patient_id] = {
          ...r.patient,
          lastVisit: r.visit_date,
          totalVisits: 1,
        };
      } else if (acc[r.patient_id]) {
        acc[r.patient_id].totalVisits++;
      }
      return acc;
    }, {}),
  );

  return (
    <div>
      <PageHeader title="My Patients" subtitle="Patients you have treated" />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.length === 0 && (
            <p className="text-gray-400 text-sm col-span-3 text-center py-12">
              No patients yet
            </p>
          )}
          {patients.map((p) => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {p.user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {p.user?.name}
                  </p>
                  <p className="text-xs text-gray-400">{p.user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Gender:</span>
                  <span className="ml-1 capitalize text-gray-700">
                    {p.gender || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Blood:</span>
                  {p.blood_group ? (
                    <span className="ml-1 font-semibold text-red-600">
                      {p.blood_group}
                    </span>
                  ) : (
                    <span className="ml-1 text-gray-700">—</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400">Phone:</span>
                  <span className="ml-1 text-gray-700">{p.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Visits:</span>
                  <span className="ml-1 font-semibold text-blue-600">
                    {p.totalVisits}
                  </span>
                </div>
                {p.lastVisit && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Last Visit:</span>
                    <span className="ml-1 text-gray-700">
                      {format(new Date(p.lastVisit), "dd MMM yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
