'use client';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-red-600">Failed to load production data</p>
      <button onClick={reset} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">
        Try again
      </button>
    </div>
  );
}
