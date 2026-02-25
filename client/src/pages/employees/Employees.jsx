import { useEffect, useRef, useState, useMemo } from "react";
import API from "../../api/api";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import EmployeeTable from "./EmployeeTable";
import EditEmployeeModal from "./EditEmployeeModal";
import DeleteEmployeeModal from "./DeleteEmployeeModal";

const Employees = () => {
  /* ================= STATE ================= */
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [deleteId, setDeleteId] = useState(null);
  const [editData, setEditData] = useState(null);

  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  const fileRef = useRef();

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [emp, dep] = await Promise.all([
        API.get("/employees"),
        API.get("/departments"),
      ]);

      setEmployees(emp.data);
      setDepartments(dep.data);
    } catch {
      setToast("Server error ⚠️");
    }
  };

  /* Toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ================= ADD EMPLOYEE ================= */
  const handleAdd = async () => {
    if (!name || !departmentId) {
      setToast("Fill all fields");
      return;
    }

    try {
      await API.post("/employees", {
        name,
        experience,
        departmentId,
      });

      setName("");
      setExperience("");
      setDepartmentId("");
      fetchData();

      setToast("Employee Added ✅");
    } catch {
      setToast("Add failed");
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    try {
      await API.delete(`/employees/${deleteId}`);
      setDeleteId(null);
      fetchData();
      setToast("Deleted Successfully");
    } catch {
      setToast("Delete failed");
    }
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    try {
      await API.patch(`/employees/${editData.id}`, editData);
      setEditData(null);
      fetchData();
      setToast("Updated Successfully");
    } catch {
      setToast("Update failed");
    }
  };

  /* ================= CSV UPLOAD ================= */
  const uploadCSV = async () => {
    if (!file) return setToast("Select CSV first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await API.post("/employee-upload", formData);

      setUploading(false);
      setFile(null);
      fileRef.current.value = "";

      fetchData();
      setToast("CSV Uploaded 🚀");
    } catch {
      setToast("Upload failed");
      setUploading(false);
    }
  };

  /* ================= FILTER (PERFORMANCE) ================= */
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
        Employee Management
      </h2>

      {/* ADD FORM */}
      <div className="bg-white rounded-2xl shadow border p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            placeholder="Employee Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            placeholder="Experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="border rounded-xl p-3"
          />

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Department</option>
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white rounded-xl py-3"
          >
            Add Employee
          </button>
        </div>
      </div>

      {/* SEARCH + UPLOAD */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center bg-white border rounded-xl px-4 flex-1 shadow-sm">
          <SearchIcon className="text-gray-400 mr-2" />
          <input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-3 w-full outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileRef}
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            onClick={uploadCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg"
          >
            {uploading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <CloudUploadIcon fontSize="small" />
            Upload
          </button>
        </div>
      </div>

      {/* TABLE */}
      <EmployeeTable
        employees={filteredEmployees}
        onEdit={setEditData}
        onDelete={setDeleteId}
      />

      {/* MODALS */}
      <EditEmployeeModal
        editData={editData}
        setEditData={setEditData}
        departments={departments}
        onUpdate={handleUpdate}
        onClose={() => setEditData(null)}
      />

      <DeleteEmployeeModal
        deleteId={deleteId}
        onDelete={confirmDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Employees;