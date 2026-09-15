import React from 'react';

export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" className="text-primary fill-primary/20" />
      <path d="M12 2a10 10 0 0 1 10 10H12V2z" className="text-blue-500 fill-blue-500/20" />
      <circle cx="12" cy="12" r="4" className="text-foreground" />
      <path d="M12 8v8M8 12h8" className="text-foreground" />
    </svg>
  );
}
