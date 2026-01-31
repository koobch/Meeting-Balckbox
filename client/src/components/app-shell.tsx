import { Link, useRoute } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Lightbulb, 
  FileText,
  HelpCircle,
  Settings
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface AppShellProps {
  projectId: string;
  children: React.ReactNode;
}

export function AppShell({ projectId, children }: AppShellProps) {
  const navItems: NavItem[] = [
    { href: `/projects/${projectId}/overview`, label: "Overview", icon: LayoutDashboard },
    { href: `/projects/${projectId}/meetings`, label: "Meetings", icon: MessageSquare },
    { href: `/projects/${projectId}/decisions`, label: "Decisions", icon: Lightbulb },
    { href: `/projects/${projectId}/evidence`, label: "Evidence", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside 
        className="w-64 flex-shrink-0 border-r border-border bg-white flex flex-col"
        data-testid="sidebar-main"
      >
        <div className="p-4 border-b border-border">
          <Link href={`/projects/${projectId}/overview`}>
            <div className="flex items-center gap-2" data-testid="logo">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">T</span>
              </div>
              <span className="text-lg font-semibold text-foreground">TRACE PM</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-border">
          <ul className="space-y-1">
            <li>
              <Link
                href="/ask"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                data-testid="nav-ask"
              >
                <HelpCircle className="w-4 h-4" />
                PM 비서에게 질문
              </Link>
            </li>
            <li>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                data-testid="nav-settings"
              >
                <Settings className="w-4 h-4" />
                설정
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const [isActive] = useRoute(item.href);
  const [isActiveWithSub] = useRoute(`${item.href}/*`);
  const active = isActive || isActiveWithSub;

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
          active 
            ? "bg-primary/10 text-primary font-medium" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        data-testid={`nav-${item.label.toLowerCase()}`}
      >
        <item.icon className="w-4 h-4" />
        {item.label}
      </Link>
    </li>
  );
}
