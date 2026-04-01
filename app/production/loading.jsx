export default function Loading() {
  return (
    <div className="space-y-5 p-1 animate-pulse">
      <div className="h-14 rounded-xl" style={{ background: '#17171c' }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl" style={{ background: '#17171c' }} />)}
      </div>
      <div className="h-80 rounded-xl" style={{ background: '#17171c' }} />
    </div>
  );
}
