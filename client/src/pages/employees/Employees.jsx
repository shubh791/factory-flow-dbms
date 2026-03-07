import { useEffect, useRef, useState, useMemo } from "react";
import API from "../../api/api";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import EmployeeTable from "./EmployeeTable";
import EditEmployeeModal from "./EditEmployeeModal";
import DeleteEmployeeModal from "./DeleteEmployeeModal";

const Employees = () => {

  /* ================= STATE ================= */

  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [roleId, setRoleId] = useState("");

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [deleteId, setDeleteId] = useState(null);
  const [editData, setEditData] = useState(null);

  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const fileRef = useRef();

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {

      const [emp, dep, roleRes] = await Promise.all([
        API.get(`/employees?t=${Date.now()}`),
        API.get("/departments"),
        API.get("/roles"),
      ]);

      setEmployees(emp.data);
      setDepartments(dep.data);
      setRoles(roleRes.data);

    } catch {
      setToast("Server error ⚠️");
    }
  };

  /* ================= TOAST ================= */

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ================= INPUT VALIDATION ================= */

  const handleNameChange = (e) => {
    const value = e.target.value;

    if (/^[A-Za-z\s]*$/.test(value)) {
      setName(value);
    }
  };

  const handleExperienceChange = (e) => {
    const value = e.target.value;

    if (/^\d*$/.test(value)) {
      setExperience(value);
    }
  };

  /* ================= ADD EMPLOYEE ================= */

  const handleAdd = async () => {

    if (!name || !departmentId || !employeeCode || !roleId) {
      setToast("Fill all fields");
      return;
    }

    try {

      await API.post("/employees", {
        name,
        experience: Number(experience),
        departmentId,
        employeeCode,
        roleId,
      });

      setName("");
      setExperience("");
      setDepartmentId("");
      setEmployeeCode("");
      setRoleId("");

      await fetchData();

      setToast("Employee Added ✅");

    } catch {
      setToast("Add failed");
    }
  };

  /* ================= DELETE SINGLE ================= */

  const confirmDelete = async () => {
    try {

      await API.delete(`/employees/${deleteId}`);

      setDeleteId(null);

      await fetchData();

      setToast("Deleted Successfully");

    } catch {
      setToast("Delete failed");
    }
  };

  /* ================= DELETE ALL ================= */

  const handleClearAll = async () => {
    try {

      const res = await API.delete("/employees/clear");

      setShowDeleteAllModal(false);

      await fetchData();

      setToast(`${res.data.deletedCount} employees removed`);

    } catch {
      setToast("Bulk delete failed");
    }
  };

  /* ================= UPDATE ================= */

  const handleUpdate = async () => {
    try {

      await API.patch(`/employees/${editData.id}`, editData);

      setEditData(null);

      await fetchData();

      setToast("Updated Successfully");

    } catch {
      setToast("Update failed");
    }
  };

  /* ================= CSV UPLOAD ================= */

  const uploadCSV = async () => {

    if (!file) {
      setToast("Select CSV first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {

      setUploading(true);

      const res = await API.post(
        "/employee-upload/upload-employees",
        formData
      );

      const updatedEmployees = await API.get(`/employees?t=${Date.now()}`);
      setEmployees(updatedEmployees.data);

      setUploading(false);
      setFile(null);

      if (fileRef.current) fileRef.current.value = "";

      setToast(`Uploaded ${res.data.inserted || "Employees"} 🚀`);

    } catch {
      setUploading(false);
      setToast("Upload failed");
    }
  };

  /* ================= FILTER ================= */

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">

      <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
        Employee Management
      </h2>

      {/* ADD FORM */}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">

          <input
            placeholder="Employee Code"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className="border rounded-xl p-3"
          />

          <input
            placeholder="Employee Name"
            value={name}
            onChange={handleNameChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            min="0"
            placeholder="Experience"
            value={experience}
            onChange={handleExperienceChange}
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

          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            className="bg-slate-900 text-white rounded-xl py-3"
          >
            Add Employee
          </button>

        </div>

      </div>

      {/* SEARCH + UPLOAD */}

      <div className="flex flex-col md:flex-row gap-4 items-center">

        <div className="flex items-center bg-white border rounded-xl px-4 flex-1">
          <SearchIcon className="text-slate-400 mr-2" />
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
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg"
          >
            {uploading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <CloudUploadIcon fontSize="small" />
            Upload
          </button>

          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            <DeleteForeverIcon fontSize="small" />
            Delete All
          </button>

        </div>

      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onEdit={setEditData}
        onDelete={setDeleteId}
      />

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

      {/* DELETE ALL MODAL */}

      {showDeleteAllModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl p-6 w-[380px] space-y-4">

            <h3 className="text-lg font-semibold text-slate-900">
              Confirm Deletion
            </h3>

            <p className="text-slate-600 text-sm">
              Are you sure you want to delete all employees?
              <br />
              This action <b>cannot be undone.</b>
            </p>

            <div className="flex justify-end gap-3 pt-3">

              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete All
              </button>

            </div>

          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-lg">
          {toast}
        </div>
      )}

    </div>
  );
};

export default Employees;