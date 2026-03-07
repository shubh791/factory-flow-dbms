const EditEmployeeModal = ({
  editData,
  setEditData,
  departments,
  onUpdate,
  onClose,
}) => {
  if (!editData) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md space-y-4">

        {/* HEADER */}
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Edit Employee Record
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Updating:
            <span className="font-medium text-slate-700 ml-1">
              {editData.employeeCode} - {editData.name}
            </span>
          </p>
        </div>

        {/* EMPLOYEE CODE */}
        <div>
          <label className="text-sm text-slate-600 block mb-1">
            Employee Code
          </label>
          <input
            value={editData.employeeCode || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                employeeCode: e.target.value,
              })
            }
            className="border rounded-xl p-3 w-full"
          />
        </div>

        {/* NAME */}
        <div>
          <label className="text-sm text-slate-600 block mb-1">
            Employee Name
          </label>
          <input
            value={editData.name || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                name: e.target.value,
              })
            }
            className="border rounded-xl p-3 w-full"
          />
        </div>

        {/* EXPERIENCE */}
        <div>
          <label className="text-sm text-slate-600 block mb-1">
            Experience (Years)
          </label>
          <input
            type="number"
            value={editData.experience || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                experience: e.target.value,
              })
            }
            className="border rounded-xl p-3 w-full"
          />
        </div>

        {/* DEPARTMENT */}
        <div>
          <label className="text-sm text-slate-600 block mb-1">
            Department
          </label>
          <select
            value={editData.departmentId || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                departmentId: e.target.value,
              })
            }
            className="border rounded-xl p-3 w-full"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Update Employee
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;