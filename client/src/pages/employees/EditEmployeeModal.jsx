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

        <h3 className="text-xl font-semibold">
          Edit Employee
        </h3>

        <input
          value={editData.name}
          onChange={(e) =>
            setEditData({ ...editData, name: e.target.value })
          }
          className="border rounded-xl p-3 w-full"
        />

        <input
          type="number"
          value={editData.experience}
          onChange={(e) =>
            setEditData({
              ...editData,
              experience: e.target.value,
            })
          }
          className="border rounded-xl p-3 w-full"
        />

        {/* NEW DEPARTMENT DROPDOWN */}
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
          <option value="">Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onUpdate}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;