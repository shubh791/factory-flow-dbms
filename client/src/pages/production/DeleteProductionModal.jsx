export default function DeleteProductionModal({
  deleteId,
  onDelete,
  onClose,
}) {
  if (!deleteId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-[320px] shadow-xl">
        <h3 className="font-semibold mb-4">
          Delete Record?
        </h3>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}