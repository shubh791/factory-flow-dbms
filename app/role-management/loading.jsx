export default function RolesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="skeleton h-8 w-48 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}
