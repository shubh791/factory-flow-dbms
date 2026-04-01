export default function PromotionsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="skeleton h-8 w-64 mb-4" />
      <div className="grid-industrial-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
