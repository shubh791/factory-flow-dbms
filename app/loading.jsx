export default function RootLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-56 mb-2" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>
      <div className="grid-industrial-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
