import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Heart, LogOut, Menu } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { APP_TITLE, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { fetchPairMembers, usePartner } from "@/lib/pair";
import { getSignedUrl } from "@/lib/storage";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/login" });
  }
  const { data: members } = useQuery({
    queryKey: ["pair-members"],
    queryFn: fetchPairMembers,
  });
  const partner = usePartner(user?.id, members);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_path")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: avatarUrl } = useQuery({
    queryKey: ["avatar", profile?.avatar_path],
    enabled: Boolean(profile?.avatar_path),
    queryFn: () => getSignedUrl("profiles", profile!.avatar_path!),
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "You";
  const initials = useMemo(() => displayName.slice(0, 2).toUpperCase(), [displayName]);

  return (
    <div className="scrapbook-bg min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/50 p-5 backdrop-blur-sm lg:flex">
          <div className="mb-8">
            <p className="font-accent text-2xl text-primary">
              {APP_TITLE} <span aria-hidden>♡</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Our private scrapbook</p>
          </div>
          <NavLinks />
          <div className="mt-auto space-y-4 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="size-3.5 text-primary" aria-hidden />
              <span>
                {displayName}
                {partner ? ` & ${partner.display_name}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={() => void handleSignOut()}>
                <LogOut className="size-3.5" />
                Log out
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md lg:px-8">
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <p className="mb-6 font-accent text-xl text-primary">{APP_TITLE} ♡</p>
                  <NavLinks />
                </SheetContent>
              </Sheet>
            </div>

            <p className="font-display text-lg lg:hidden">
              {APP_TITLE} <span className="text-primary">♡</span>
            </p>

            <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-accent">
              <Bell className="size-5 text-muted-foreground" />
              {unreadCount > 0 ? (
                <Badge className="absolute -right-0.5 -top-0.5 size-5 justify-center rounded-full p-0 text-[10px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              ) : null}
              <span className="sr-only">Notifications</span>
            </Link>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

          <footer className="border-t border-border/40 px-4 py-4 text-center text-xs text-muted-foreground">
            Made with love ♡
          </footer>
        </div>
      </div>
    </div>
  );
}