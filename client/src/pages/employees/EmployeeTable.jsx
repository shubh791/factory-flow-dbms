import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const EmployeeTable = React.memo(({ employees, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow border overflow-x-auto">
      <table className="w-full text-left min-w-[650px]">
        <thead className="bg-gray-50 border-b text-gray-600">
          <tr>
            <th className="p-4">#</th>
            <th>Name</th>
            <th>Department</th>
            <th>Experience</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp, i) => (
            <tr key={emp.id} className="border-b hover:bg-gray-50">
              <td className="p-4">{i + 1}</td>
              <td>{emp.name}</td>
              <td>{emp.department?.name}</td>
              <td>{emp.experience} yrs</td>

              <td className="flex gap-4 py-4">
                <button onClick={() => onEdit(emp)}>
                  <EditIcon className="text-blue-600" />
                </button>

                <button onClick={() => onDelete(emp.id)}>
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

export default EmployeeTable;