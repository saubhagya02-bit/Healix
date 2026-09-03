import { useEffect, useState } from "react";
import { recordAPI } from "../../services/api";
import { PageHeader, LoadingSpinner } from "../../components/common";
import { format } from "date-fns";
import { Pill } from "lucide-react";

export default function PatientPrescriptions() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordAPI
      .getAll()
      .then((r) =>
        setRecords(r.data.filter((r) => r.prescriptions?.length > 0)),
      )
      .finally(() => setLoading(false));
  }, []);

  const allPrescriptions = records.flatMap((r) =>
    r.prescriptions.map((rx) => ({
      ...rx,
      diagnosis: r.diagnosis,
      doctorName: r.doctor?.user?.name,
      visitDate: r.visit_date,
    })),
  );

  return (
    <div>
      <PageHeader
        title="My Prescriptions"
        subtitle="All prescriptions from your consultations"
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {allPrescriptions.length === 0 ? (
            <div className="card text-center py-12">
              <Pill className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No prescriptions yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPrescriptions.map((rx, i) => (
                <div key={i} className="card border-l-4 border-green-400">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {rx.medicine_name}
                      </h3>
                      {rx.dosage && (
                        <p className="text-xs text-green-600 font-medium">
                          {rx.dosage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    {rx.frequency && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Frequency:</span>
                        <span>{rx.frequency}</span>
                      </div>
                    )}
                    {rx.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span>{rx.duration}</span>
                      </div>
                    )}
                    {rx.instructions && (
                      <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded text-xs">
                        {rx.instructions}
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <p className="text-gray-400 text-xs">
                        For: {rx.diagnosis}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Dr. {rx.doctorName} ·{" "}
                        {rx.visitDate
                          ? format(new Date(rx.visitDate), "dd MMM yyyy")
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
