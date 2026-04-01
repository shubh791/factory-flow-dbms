export default function Loading() {
  return (
    <div className="space-y-5 p-1 animate-pulse">
      <div className="h-14 rounded-xl" style={{ background: '#17171c' }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl" style={{ background: '#17171c' }} />)}
      </div>
      <div className="h-96 rounded-xl" style={{ background: '#17171c' }} />
    </div>
  );
}
