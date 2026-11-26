import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { appHeadTitle } from "@/routes/_app";
import { ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/achievements")({
  component: AchievementsPage,
  head: () => appHeadTitle("Achievements"),
});

function AchievementsPage() {
  const { user } = useAuth();

  const data = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [defs, unlocked] = await Promise.all([
        supabase.from("achievements").select("*").order("code"),
        supabase.from("user_achievements").select("achievement_code, unlocked_at").eq("user_id", user!.id),
      ]);
      if (defs.error) throw defs.error;
      if (unlocked.error) throw unlocked.error;
      const unlockedSet = new Map(
        (unlocked.data ?? []).map((u) => [u.achievement_code, u.unlocked_at] as const),
      );
      return (defs.data ?? []).map((a) => ({
        ...a,
        unlockedAt: unlockedSet.get(a.code) ?? null,
      }));
    },
  });

  if (data.isLoading) return <LoadingBlock />;
  if (data.error) return <ErrorBlock message="Could not load achievements." />;

  const list = data.data ?? [];
  const unlockedCount = list.filter((a) => a.unlockedAt).length;

  return (
    <div>
      <PageHeader
        title="Achievements"
        description={`${unlockedCount} of ${list.length} little badges collected.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => {
          const isUnlocked = Boolean(a.unlockedAt);
          return (
            <ScrapbookCard
              key={a.code}
              className={cn(
                "relative",
                isUnlocked ? "border-primary/40 bg-primary/5" : "opacity-80",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-full text-lg",
                    isUnlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {isUnlocked ? "♡" : <Lock className="size-4" />}
                </div>
                <div>
                  <p className="font-display text-lg">{a.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                  {isUnlocked && a.unlockedAt ? (
                    <p className="mt-2 text-xs text-primary">
                      Unlocked {format(new Date(a.unlockedAt), "MMM d, yyyy")}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Still waiting to be earned</p>
                  )}
                </div>
              </div>
            </ScrapbookCard>
          );
        })}
      </div>
    </div>
  );
}