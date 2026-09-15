import { BrainCircuit, Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <BrainCircuit className="w-16 h-16 text-primary opacity-20" />
        <Loader2 className="w-16 h-16 text-primary absolute top-0 left-0 animate-spin" />
      </div>
      <h3 className="text-xl font-medium text-foreground tracking-tight">Initializing Platform...</h3>
      <p className="text-sm text-muted-foreground">Loading machine learning modules</p>
    </div>
  );
}
