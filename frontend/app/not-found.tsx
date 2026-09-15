import Link from 'next/link';
import { CloudOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
        <CloudOff className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
      <h2 className="text-2xl font-semibold tracking-tight">Signal Lost</h2>
      <p className="text-muted-foreground max-w-md">
        The satellite data or module you are looking for cannot be found in the current spatial dimension.
      </p>
      <Link href="/" className="inline-flex items-center justify-center rounded-full shadow-lg h-9 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors mt-4">
        Return to Dashboard
      </Link>
    </div>
  );
}
