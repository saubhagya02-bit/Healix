import { useEffect, useState } from "react";
import { recordAPI } from "../../services/api";
import {
  PageHeader,
  Table,
  LoadingSpinner,
  Modal,
} from "../../components/common";
import { format } from "date-fns";
import { Eye, Pill } from "lucide-react";

export default function DoctorRecords() {
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
      <PageHeader title="Medical Records" subtitle="Records you have created" />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={[
              "Patient",
              "Diagnosis",
              "Visit Date",
              "Follow-up",
              "Prescriptions",
              "Actions",
            ]}
            isEmpty={records.length === 0}
            emptyMessage="No records found"
          >
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">
                  {r.patient?.user?.name}
                </td>
                <td className="table-cell max-w-xs truncate">{r.diagnosis}</td>
                <td className="table-cell text-gray-500 text-xs">
                  {r.visit_date
                    ? format(new Date(r.visit_date), "dd MMM yyyy")
                    : "—"}
                </td>
                <td className="table-cell text-xs">
                  {r.follow_up_date ? (
                    <span className="text-orange-600 font-medium">
                      {format(new Date(r.follow_up_date), "dd MMM yyyy")}
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="table-cell">
                  <span className="flex items-center gap-1 text-blue-600 text-xs">
                    <Pill className="w-3 h-3" /> {r.prescriptions?.length ?? 0}
                  </span>
                </td>
                <td className="table-cell">
                  <button
                    onClick={() => setSelected(r)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Record Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Medical Record Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                  Patient
                </p>
                <p className="font-semibold">{selected.patient?.user?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                  Visit Date
                </p>
                <p className="font-semibold">
                  {selected.visit_date
                    ? format(
                        new Date(selected.visit_date),
                        "dd MMM yyyy, HH:mm",
                      )
                    : "—"}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Diagnosis
              </p>
              <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-lg">
                {selected.diagnosis}
              </p>
            </div>

            {selected.treatment && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Treatment Plan
                </p>
                <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                  {selected.treatment}
                </p>
              </div>
            )}

            {selected.notes && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Clinical Notes
                </p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selected.notes}
                </p>
              </div>
            )}

            {selected.follow_up_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Follow-up Date
                </p>
                <p className="text-sm font-semibold text-orange-600">
                  {format(new Date(selected.follow_up_date), "dd MMM yyyy")}
                </p>
              </div>
            )}

            {selected.prescriptions?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Prescriptions
                </p>
                <div className="space-y-2">
                  {selected.prescriptions.map((rx, i) => (
                    <div
                      key={i}
                      className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-800">
                          {rx.medicine_name}
                        </span>
                        {rx.dosage && (
                          <span className="text-green-600">— {rx.dosage}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 grid grid-cols-2 gap-1 ml-6">
                        {rx.frequency && <span>Frequency: {rx.frequency}</span>}
                        {rx.duration && <span>Duration: {rx.duration}</span>}
                        {rx.instructions && (
                          <span className="col-span-2">
                            Note: {rx.instructions}
                          </span>
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
