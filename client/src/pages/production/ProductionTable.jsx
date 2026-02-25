import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ProductionTable = React.memo(({ records, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow border overflow-x-auto">
      <table className="w-full text-left min-w-[650px]">
        <thead className="bg-gray-50 border-b text-gray-600">
          <tr>
            <th className="p-4">#</th>
            <th>Product</th>
            <th>Units</th>
            <th>Defects</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {records.map((rec, i) => (
            <tr key={rec.id} className="border-b hover:bg-gray-50">
              <td className="p-4">{i + 1}</td>
              <td>{rec.product?.name}</td>
              <td>{rec.units}</td>
              <td>{rec.defects}</td>

              <td className="flex gap-4 py-4">
                <button onClick={() => onEdit(rec)}>
                  <EditIcon className="text-blue-600" />
                </button>

                <button onClick={() => onDelete(rec.id)}>
                  <DeleteIcon className="text-red-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default ProductionTable;