import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h2 className="text-3xl font-semibold text-slate-800">Page Not Found</h2>
      <p className="text-slate-500">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 transition"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
