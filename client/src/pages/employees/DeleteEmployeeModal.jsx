const DeleteEmployeeModal = ({ deleteId, onDelete, onClose }) => {
  if (!deleteId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center space-y-4">

        <h3 className="text-lg font-semibold">
          Confirm Delete?
        </h3>

        <p className="text-gray-500 text-sm">
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEmployeeModal;