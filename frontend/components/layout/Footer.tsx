import { BrainCircuit } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur shrink-0">
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Climate Extreme Predictor</span>
        </div>
      </div>
    </footer>
  );
}
