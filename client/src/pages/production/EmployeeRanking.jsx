export default function EmployeeRanking({ ranking }) {
  if (!ranking || !ranking.length) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="text-lg font-semibold mb-4">
        Top Performing Employees
      </h3>

      <ul className="space-y-3">
        {ranking.map((e, i) => (
          <li
            key={i}
            className="flex justify-between border-b pb-2 text-sm"
          >
            <span>{e.name}</span>
            <span className="font-medium">
              {e.units.toLocaleString()} units
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}