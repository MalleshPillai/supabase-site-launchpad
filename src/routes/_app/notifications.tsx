import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { appHeadTitle } from "@/routes/_app";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
  head: () => appHeadTitle("Notifications"),
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["notifications"] });
      await qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["notifications"] });
      await qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  if (notifications.isLoading) return <LoadingBlock />;
  if (notifications.error) return <ErrorBlock message="Could not load notifications." />;

  const list = notifications.data ?? [];
  const unread = list.filter((n) => !n.read_at);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Little pings from our shared world."
        action={
          unread.length ? (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              Mark all read
            </Button>
          ) : null
        }
      />

      {!list.length ? (
        <EmptyState title="All quiet" description="When something sweet happens, you'll see it here." />
      ) : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n.id}>
              <ScrapbookCard
                className={cn(!n.read_at && "border-primary/30 bg-primary/5")}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(new Date(n.created_at), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  {!n.read_at ? (
                    <Button size="sm" variant="secondary" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </ScrapbookCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}