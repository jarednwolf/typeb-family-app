export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-2">Page not found</h1>
        <p className="text-neutral-600 mb-4">The page you are looking for does not exist.</p>
        <a href="/dashboard" className="btn btn-primary px-4">Return to Dashboard</a>
      </div>
    </div>
  );
}


