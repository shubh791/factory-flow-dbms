export default function DecisionSupportLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="skeleton h-8 w-64 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );
}
