'use client';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // Log error for diagnostics without exposing details in UI
    console.error('Global error boundary:', error);
  }, [error]);
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-neutral-600 mb-4">An error occurred while rendering this page.</p>
            <a href="/dashboard" className="btn btn-primary px-4">Return to Dashboard</a>
          </div>
        </div>
      </body>
    </html>
  );
}


