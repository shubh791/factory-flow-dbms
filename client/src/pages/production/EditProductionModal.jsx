export default function EditProductionModal({
  editData,
  setEditData,
  products,
  onUpdate,
  onClose,
}) {
  if (!editData) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[380px] space-y-4">
        <h3 className="font-semibold text-lg">Edit Record</h3>

        <input
          type="number"
          value={editData.units}
          onChange={e =>
            setEditData({ ...editData, units: e.target.value })
          }
          className="border w-full p-3 rounded-lg"
        />

        <input
          type="number"
          value={editData.defects}
          onChange={e =>
            setEditData({ ...editData, defects: e.target.value })
          }
          className="border w-full p-3 rounded-lg"
        />

        <select
          value={editData.productId}
          onChange={e =>
            setEditData({ ...editData, productId: e.target.value })
          }
          className="border w-full p-3 rounded-lg"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}