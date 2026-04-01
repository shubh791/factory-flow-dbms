export default function EmployeesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>
      <div className="grid-industrial-3">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-96 rounded-xl" />
    </div>
  );
}
