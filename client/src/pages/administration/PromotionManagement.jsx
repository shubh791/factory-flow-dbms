import { useEffect, useState } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
==================================================
PROMOTION MANAGEMENT – SAFE VERSION
==================================================
*/

export default function PromotionManagement() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  /* ================= SAFE DATA LOADER ================= */

  const loadData = async () => {
    try {
      const empRes = await API.get("/employees");
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    } catch (err) {
      console.error("Employees fetch failed:", err);
      setEmployees([]);
    }

    try {
      const roleRes = await API.get("/roles");
      setRoles(Array.isArray(roleRes.data) ? roleRes.data : []);
    } catch (err) {
      console.error("Roles fetch failed:", err);
      setRoles([]);
    }

    try {
      const promoRes = await API.get("/promotions");
      setPromotions(Array.isArray(promoRes.data) ? promoRes.data : []);
    } catch (err) {
      console.error("Promotions fetch failed:", err);
      setPromotions([]);
    }
  };

  /* ================= SELECTED DATA ================= */

  const selectedEmployee = employees.find(
    (e) => e.id === Number(employeeId)
  );

  const selectedRole = roles.find(
    (r) => r.id === Number(newRoleId)
  );

  /* ================= HANDLE PROMOTION ================= */

  const handlePromote = async () => {
    if (!employeeId || !newRoleId) return;

    setLoading(true);

    try {
      await API.post("/promotions", {
        employeeId: Number(employeeId),
        newRoleId: Number(newRoleId),
        remarks,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);

      setEmployeeId("");
      setNewRoleId("");
      setRemarks("");

      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Promotion failed");
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-50 min-h-screen p-8 space-y-10"
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          Promotion Management
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Structured employee role progression.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          Promotion processed successfully.
        </div>
      )}

      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl border space-y-5">

        {/* Employee Select */}
        <div>
          <label className="text-sm text-slate-600">
            Select Employee
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="border p-3 rounded-lg w-full mt-2"
          >
            <option value="">Choose employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.role ? emp.role.title : "No Role"}
              </option>
            ))}
          </select>
        </div>

        {/* Current Role */}
        {selectedEmployee && (
          <div className="bg-slate-100 p-3 rounded-lg text-sm">
            Current Role:
            <span className="ml-2 font-medium">
              {selectedEmployee.role?.title}
            </span>
          </div>
        )}

        {/* Role Select */}
        <div>
          <label className="text-sm text-slate-600">
            Select New Role
          </label>
          <select
            value={newRoleId}
            onChange={(e) => setNewRoleId(e.target.value)}
            className="border p-3 rounded-lg w-full mt-2"
          >
            <option value="">Choose new role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title} (Level {role.level})
              </option>
            ))}
          </select>
        </div>

        {/* Role Comparison */}
        {selectedEmployee && selectedRole && (
          <div className="bg-indigo-100 p-3 rounded-lg text-sm">
            {selectedEmployee.role?.title} → {selectedRole.title}
          </div>
        )}

        {/* Remarks */}
        <textarea
          placeholder="Promotion remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />

        <button
          onClick={handlePromote}
          disabled={loading}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Processing..." : "Promote Employee"}
        </button>
      </div>

      {/* HISTORY */}
      <div className="bg-white p-6 rounded-2xl border">
        <h3 className="font-semibold mb-4">
          Promotion History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Old Role</th>
                <th className="p-3 text-left">New Role</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-500">
                    No promotions recorded
                  </td>
                </tr>
              ) : (
                promotions.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      {p.employee?.name || "-"}
                    </td>
                    <td className="p-3">
                      {p.oldRole?.title || "-"}
                    </td>
                    <td className="p-3 font-medium">
                      {p.newRole?.title || "-"}
                    </td>
                    <td className="p-3">
                      {p.promotedAt
                        ? new Date(p.promotedAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}