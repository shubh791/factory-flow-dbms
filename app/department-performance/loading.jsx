export default function DeptLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="skeleton h-8 w-56 mb-4" />
      <div className="grid-industrial-3">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
