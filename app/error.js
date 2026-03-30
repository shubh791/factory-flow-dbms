'use client';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6">
      <h2 className="text-2xl font-semibold text-slate-800">Something went wrong</h2>
      <p className="text-slate-500 text-sm max-w-md text-center">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
