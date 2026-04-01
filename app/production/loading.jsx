export default function ProductionLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-56 mb-2" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>
      <div className="grid-industrial-3">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-96 rounded-xl" />
    </div>
  );
}
