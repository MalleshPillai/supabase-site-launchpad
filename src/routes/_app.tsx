import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { requireSession } from "@/lib/auth-guard";
import { APP_TITLE } from "@/lib/navigation";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ matches }) => {
    // Pathless layout can participate in `/` matching on some SSR hosts; only guard real app pages.
    const onAppPage = matches.some(
      (m) => m.routeId.startsWith("/_app/") && m.routeId !== "/_app",
    );
    if (!onAppPage) return;
    return requireSession();
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const appHeadTitle = (page: string) => ({ meta: [{ title: `${page} — ${APP_TITLE}` }] });