import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MonitorPlay,
  Image as ImageIcon,
  ListMusic,
  CalendarClock,
  Store,
  LogOut,
  Radio,
  ChevronDown,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/screens", label: "Screens", icon: MonitorPlay },
  { to: "/media", label: "Media", icon: ImageIcon },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/schedules", label: "Schedules", icon: CalendarClock },
  { to: "/stores", label: "Stores", icon: Store },
] as const;

export function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { user, roles, isSuper, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();
  const roleLabel = isSuper ? "Super Admin" : isAdmin ? "Admin" : roles[0] ?? "viewer";

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Radio className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Signal</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 text-xs text-sidebar-foreground/50 border-t border-sidebar-border">
          v1.0 · {new Date().getFullYear()}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card/40 px-6 backdrop-blur">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {initials}
                  </span>
                  <span className="hidden sm:inline text-sm">{user?.email}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{user?.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">{roleLabel.replace("_", " ")}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
