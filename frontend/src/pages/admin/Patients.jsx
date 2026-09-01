import { useEffect, useState } from "react";
import { patientAPI } from "../../services/api";
import { PageHeader, Table, LoadingSpinner } from "../../components/common";
import { format } from "date-fns";
import { Search } from "lucide-react";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    patientAPI
      .getAll(search ? { search } : {})
      .then((r) => setPatients(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="All registered patients"
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-9 w-64"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            headers={[
              "Name",
              "Email",
              "Phone",
              "Gender",
              "Blood Group",
              "DOB",
              "Registered",
            ]}
            isEmpty={patients.length === 0}
            emptyMessage="No patients found"
          >
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-900">
                  {p.user?.name}
                </td>
                <td className="table-cell text-gray-500">{p.user?.email}</td>
                <td className="table-cell">{p.phone || "—"}</td>
                <td className="table-cell capitalize">{p.gender || "—"}</td>
                <td className="table-cell">
                  {p.blood_group ? (
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">
                      {p.blood_group}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="table-cell">
                  {p.dob ? format(new Date(p.dob), "dd MMM yyyy") : "—"}
                </td>
                <td className="table-cell text-gray-400 text-xs">
                  {p.created_at
                    ? format(new Date(p.created_at), "dd MMM yyyy")
                    : "—"}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
