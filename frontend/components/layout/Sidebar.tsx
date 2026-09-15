"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { 
  Database, GitBranch, Info, 
  PlayCircle, BrainCircuit, Activity,
  LayoutDashboard, Book, Code
} from 'lucide-react';

const groups = [
  {
    title: "Overview",
    links: [
      { name: "Landing", href: "/", icon: LayoutDashboard }
    ]
  },
  {
    title: "Research",
    links: [
      { name: "Dataset Explorer", href: "/datasets", icon: Database },
      { name: "Pipeline", href: "/pipeline", icon: GitBranch },
      { name: "About Project", href: "/about", icon: Info },
      { name: "Documentation", href: "/docs", icon: Book }
    ]
  },
  {
    title: "Prediction",
    links: [
      { name: "Predict Event", href: "/predict", icon: PlayCircle },
    ]
  },
  {
    title: "Analytics",
    links: [
      { name: "Model Dashboard", href: "/models", icon: BrainCircuit },
      { name: "Metrics", href: "/metrics", icon: Activity },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0 shadow-sm z-10">
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <Logo className="w-6 h-6" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Climate Extreme Predictor
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
