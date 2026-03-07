import { useEffect, useState } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
==================================================
ROLE MANAGEMENT – ENTERPRISE HIERARCHY DESIGN
==================================================
*/

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await API.get("/roles");
      setRoles(res.data.sort((a, b) => a.level - b.level));
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const handleCreate = async () => {
    if (!title || !level) return;

    if (roles.some(r => r.level === Number(level))) {
      alert("This hierarchy level already exists.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/roles", {
        title: title.trim(),
        level: Number(level),
      });

      setTitle("");
      setLevel("");
      loadRoles();
    } catch (err) {
      console.error(err);
      alert("Role creation failed");
    }

    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await API.delete(`/roles/${id}`);
      loadRoles();
    } catch {
      alert("Cannot delete role. It may be assigned to employees.");
    }
  };

  const getLevelColor = (level) => {
    if (level === 1) return "bg-blue-100 text-blue-700";
    if (level === 2) return "bg-indigo-100 text-indigo-700";
    if (level === 3) return "bg-purple-100 text-purple-700";
    if (level === 4) return "bg-yellow-100 text-yellow-700";
    if (level === 5) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-10 space-y-12"
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          Role & Hierarchy Management
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Define structured organizational role levels for enterprise governance.
        </p>
      </div>

      {/* CREATE ROLE CARD */}
      <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6 max-w-xl">

        <div>
          <label className="text-sm text-slate-600">
            Role Title
          </label>
          <input
            placeholder="e.g. Senior Operator"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-3 rounded-xl w-full mt-2"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">
            Hierarchy Level
          </label>
          <input
            type="number"
            placeholder="e.g. 3"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border p-3 rounded-xl w-full mt-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            Lower number = lower position in hierarchy.
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Role"}
        </button>
      </div>

      {/* ROLE TABLE */}
      <div className="bg-white p-8 rounded-3xl border shadow-sm">
        <h3 className="font-semibold mb-6">
          Organizational Hierarchy
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Level</th>
                <th className="p-3 text-left">Designation</th>
                <th className="p-3 text-left">Hierarchy Position</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-t hover:bg-slate-50 transition">
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(role.level)}`}>
                      Level {role.level}
                    </span>
                  </td>

                  <td className="p-3 font-medium text-slate-900">
                    {role.title}
                  </td>

                  <td className="p-3 text-slate-600">
                    {role.level === 1 && "Entry Level"}
                    {role.level === 2 && "Operational Staff"}
                    {role.level === 3 && "Senior Staff"}
                    {role.level === 4 && "Supervisory Level"}
                    {role.level === 5 && "Management Level"}
                    {role.level >= 6 && "Executive Level"}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {roles.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-slate-500">
                    No roles defined.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}