import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ProductionTable = React.memo(({ records, onEdit, onDelete }) => {

  return (
    <div className="bg-white rounded-2xl shadow border overflow-x-auto">

      <table className="w-full text-left">

        <thead className="bg-gray-50 border-b text-gray-600 text-sm">
          <tr>
            <th className="p-4">#</th>
            <th>Product</th>
            <th>Employee</th>
            <th>Department</th>
            <th>Units</th>
            <th>Defects</th>
            <th>Revenue Impact</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody className="text-sm">

          {records.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-6 text-slate-500">
                No production records found
              </td>
            </tr>
          ) : (

            records.map((rec, index) => {

              const units = Number(rec.units) || 0;
              const defects = Number(rec.defects) || 0;

              return (

                <tr key={rec.id} className="border-b hover:bg-gray-50">

                  <td className="p-4 font-medium">
                    {index + 1}
                  </td>

                  <td>
                    {rec.product?.name || "-"}
                  </td>

                  <td>
                    {rec.employee?.name || "-"}
                  </td>

                  <td>
                    {rec.employee?.department?.name || "-"}
                  </td>

                  <td>
                    {units}
                  </td>

                  <td className="text-red-600 font-medium">
                    {defects}
                  </td>

                  <td className="text-green-600 font-semibold">
                    ₹{rec.revenue?.toLocaleString() || 0}
                  </td>

                  <td className="flex gap-4 py-4">

                    <button onClick={() => onEdit(rec)}>
                      <EditIcon className="text-blue-600" />
                    </button>

                    <button onClick={() => onDelete(rec.id)}>
                      <DeleteIcon className="text-red-600" />
                    </button>

                  </td>

                </tr>

              );

            })

          )}

        </tbody>

      </table>

    </div>
  );

});

export default ProductionTable;