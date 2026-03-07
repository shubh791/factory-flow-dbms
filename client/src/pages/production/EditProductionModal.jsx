import React from "react";

export default function EditProductionModal({
  editData,
  setEditData,
  products,
  employees,
  onUpdate,
  onClose,
}) {
  if (!editData) return null;

  const selectedProduct = products.find(
    (p) => p.id === Number(editData.productId)
  );

  const unitPrice = selectedProduct?.unitPrice || 0;

  const units = Number(editData.units) || 0;
  const defects = Number(editData.defects) || 0;

  const revenue = units * unitPrice;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-6">

        {/* HEADER */}
        <div>
          <h3 className="font-semibold text-xl text-slate-900">
            Edit Production Record
          </h3>

          <div className="mt-3 text-sm text-slate-600 space-y-1">
            <p>
              <span className="font-medium">Product:</span>{" "}
              {editData.product?.name}
            </p>
            <p>
              <span className="font-medium">Employee:</span>{" "}
              {editData.employee?.name}
            </p>
            <p>
              <span className="font-medium">Department:</span>{" "}
              {editData.employee?.department?.name}
            </p>
          </div>
        </div>

        {/* INPUT FIELDS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">
              Units Produced
            </label>
            <input
              type="number"
              value={editData.units}
              onChange={(e) =>
                setEditData({ ...editData, units: e.target.value })
              }
              className="border w-full p-3 rounded-lg mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">
              Defective Units
            </label>
            <input
              type="number"
              value={editData.defects}
              onChange={(e) =>
                setEditData({ ...editData, defects: e.target.value })
              }
              className="border w-full p-3 rounded-lg mt-1"
            />
          </div>
        </div>

        {/* PRODUCT SELECT */}
        <div>
          <label className="text-sm text-slate-600">
            Product
          </label>
          <select
            value={editData.productId}
            onChange={(e) =>
              setEditData({ ...editData, productId: Number(e.target.value) })
            }
            className="border w-full p-3 rounded-lg mt-1"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* EMPLOYEE SELECT */}
        <div>
          <label className="text-sm text-slate-600">
            Employee
          </label>
          <select
            value={editData.employeeId}
            onChange={(e) =>
              setEditData({ ...editData, employeeId: Number(e.target.value) })
            }
            className="border w-full p-3 rounded-lg mt-1"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department?.name})
              </option>
            ))}
          </select>
        </div>

        {/* REVENUE PREVIEW */}
        <div className="bg-slate-50 p-4 rounded-xl border text-sm">
          <p>
            <span className="font-medium">Unit Price:</span>{" "}
            ₹{unitPrice.toLocaleString()}
          </p>
          <p className="mt-2 text-green-600 font-semibold">
            Revenue Impact: ₹{revenue.toLocaleString()}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onUpdate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg"
          >
            Update Record
          </button>
        </div>
      </div>
    </div>
  );
}