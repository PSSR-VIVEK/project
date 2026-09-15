import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">AI Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
