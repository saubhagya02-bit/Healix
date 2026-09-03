import { useEffect, useState } from "react";
import { recordAPI } from "../../services/api";
import { PageHeader, LoadingSpinner, Modal } from "../../components/common";
import { format } from "date-fns";
import { FileText, Pill, Eye } from "lucide-react";

export default function PatientRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    recordAPI
      .getAll()
      .then((r) => setRecords(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Medical Records"
        subtitle="Your complete health history"
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {records.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No medical records yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {r.diagnosis}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Dr. {r.doctor?.user?.name} ·{" "}
                            {r.visit_date
                              ? format(new Date(r.visit_date), "dd MMM yyyy")
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {r.treatment && (
                        <p className="text-sm text-gray-600 ml-11 mb-2">
                          <span className="text-gray-400 text-xs">
                            Treatment:{" "}
                          </span>
                          {r.treatment}
                        </p>
                      )}

                      <div className="ml-11 flex flex-wrap gap-2">
                        {r.prescriptions?.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                            <Pill className="w-3 h-3" />
                            {r.prescriptions.length} prescription
                            {r.prescriptions.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {r.follow_up_date && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                            Follow-up:{" "}
                            {format(new Date(r.follow_up_date), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelected(r)}
                      className="ml-4 text-blue-500 hover:text-blue-700 flex-shrink-0"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Medical Record"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Doctor
                </p>
                <p className="font-medium">Dr. {selected.doctor?.user?.name}</p>
                <p className="text-xs text-gray-500">
                  {selected.doctor?.specialization}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Visit Date
                </p>
                <p className="font-medium">
                  {selected.visit_date
                    ? format(new Date(selected.visit_date), "dd MMM yyyy")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-400 uppercase tracking-wide mb-1">
                Diagnosis
              </p>
              <p className="text-sm text-red-900 font-medium">
                {selected.diagnosis}
              </p>
            </div>

            {selected.treatment && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">
                  Treatment
                </p>
                <p className="text-sm text-blue-900">{selected.treatment}</p>
              </div>
            )}

            {selected.notes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{selected.notes}</p>
              </div>
            )}

            {selected.follow_up_date && (
              <div className="text-sm">
                <span className="text-gray-400">Follow-up: </span>
                <span className="font-semibold text-orange-600">
                  {format(new Date(selected.follow_up_date), "dd MMMM yyyy")}
                </span>
              </div>
            )}

            {selected.prescriptions?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  Prescriptions
                </p>
                <div className="space-y-2">
                  {selected.prescriptions.map((rx, i) => (
                    <div key={i} className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-sm text-green-800">
                          {rx.medicine_name}
                        </span>
                        {rx.dosage && (
                          <span className="text-xs text-green-600">
                            {rx.dosage}
                          </span>
                        )}
                      </div>
                      <div className="ml-6 text-xs text-gray-600 space-y-0.5">
                        {rx.frequency && <p>Frequency: {rx.frequency}</p>}
                        {rx.duration && <p>Duration: {rx.duration}</p>}
                        {rx.instructions && (
                          <p className="text-blue-600">{rx.instructions}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
