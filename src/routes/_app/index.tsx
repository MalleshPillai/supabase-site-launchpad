import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Heart, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appHeadTitle } from "@/routes/_app";
import { APP_TAGLINE } from "@/lib/navigation";
import {
  ErrorBlock,
  LoadingBlock,
  PolaroidFrame,
  ScrapbookCard,
} from "@/components/app/scrapbook-ui";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchDailySurprise } from "@/lib/daily-surprise";
import { displayNameFor, fetchPairMembers } from "@/lib/pair";
import { getSignedUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
  head: () => appHeadTitle("Home"),
});

function HomePage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: members, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ["pair-members"],
    queryFn: fetchPairMembers,
  });

  const dashboard = useQuery({
    queryKey: ["home-dashboard", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [memoriesRes, lettersRes, balancesRes, bucketRes, achievementsRes, featuredRes, happinessRes, surprise] =
        await Promise.all([
          supabase.from("memories").select("id, caption, photo_path, memory_date").order("created_at", { ascending: false }).limit(4),
          supabase.from("letters").select("id, letter_type, sent_at, status").eq("status", "sent").order("sent_at", { ascending: false }).limit(3),
          supabase.from("brownie_balances").select("user_id, balance"),
          supabase.from("bucket_list_items").select("id, is_completed"),
          supabase
            .from("user_achievements")
            .select("achievement_code, unlocked_at")
            .eq("user_id", userId!)
            .order("unlocked_at", { ascending: false })
            .limit(4),
          supabase.from("memories").select("id, caption, photo_path, memory_date").eq("is_featured", true).order("memory_date", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("happiness_notes").select("id, content").order("created_at", { ascending: false }).limit(1).maybeSingle(),
          fetchDailySurprise(),
        ]);

      const errors = [
        memoriesRes.error,
        lettersRes.error,
        balancesRes.error,
        bucketRes.error,
        achievementsRes.error,
        featuredRes.error,
        happinessRes.error,
      ].filter(Boolean);
      if (errors.length) throw errors[0];

      const featured = featuredRes.data ?? memoriesRes.data?.[0] ?? null;
      let featuredUrl: string | null = null;
      if (featured?.photo_path) {
        featuredUrl = await getSignedUrl("memories", featured.photo_path);
      }

      const bucketItems = bucketRes.data ?? [];
      const completed = bucketItems.filter((b) => b.is_completed).length;
      const bucketProgress = bucketItems.length ? Math.round((completed / bucketItems.length) * 100) : 0;

      return {
        memories: memoriesRes.data ?? [],
        letters: lettersRes.data ?? [],
        balances: balancesRes.data ?? [],
        bucketProgress,
        bucketTotal: bucketItems.length,
        bucketCompleted: completed,
        achievements: achievementsRes.data ?? [],
        surprise,
        featured,
        featuredUrl,
        randomHappiness: happinessRes.data?.content ?? null,
      };
    },
  });

  if (membersLoading || dashboard.isLoading) return <LoadingBlock label="Opening our little world…" />;
  if (membersError || dashboard.error) {
    return <ErrorBlock message="We couldn't load the dashboard. Try refreshing." />;
  }

  const d = dashboard.data!;
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const myBalance = d.balances.find((b) => b.user_id === userId)?.balance ?? 0;

  return (
    <div className="space-y-8">
      <header className="animate-fade-in">
        <p className="font-accent text-2xl text-primary">Welcome to our little world ♡</p>
        <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">{APP_TAGLINE}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{today}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {displayNameFor(userId!, members)}
          {members && members.length > 1 ? ` & ${members.find((m) => m.user_id !== userId)?.display_name}` : ""}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <ScrapbookCard className="lg:col-span-2" tape>
          <h2 className="font-display text-xl">Featured memory</h2>
          {d.featured ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PolaroidFrame
                src={d.featuredUrl}
                alt={d.featured.caption || "Memory"}
                caption={d.featured.caption || format(new Date(d.featured.memory_date), "MMM d, yyyy")}
                className="max-w-xs"
              />
              <div className="flex flex-col justify-center">
                <p className="text-sm text-muted-foreground">
                  {d.featured.caption || "A moment worth keeping close."}
                </p>
                <Button asChild variant="link" className="mt-2 w-fit px-0">
                  <Link to="/memories">See all memories →</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="font-accent text-xl text-primary">Your first polaroid awaits</p>
              <p className="mt-2 text-sm text-muted-foreground">Upload a photograph together and it might shine here.</p>
              <Button asChild className="mt-4">
                <Link to="/memories">Add a memory</Link>
              </Button>
            </div>
          )}
        </ScrapbookCard>

        <ScrapbookCard>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-xl">Daily surprise</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {d.surprise?.content ?? "Open the app tomorrow for a new little delight."}
          </p>
        </ScrapbookCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <ScrapbookCard>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your brownies</p>
          <p className="font-display mt-1 text-4xl text-primary">{myBalance}</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/brownies">Brownie Bank</Link>
          </Button>
        </ScrapbookCard>

        <ScrapbookCard>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bucket list</p>
          <p className="mt-1 text-sm">
            {d.bucketCompleted} of {d.bucketTotal} wishes
          </p>
          <Progress value={d.bucketProgress} className="mt-3" />
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/bucket-list">Our list</Link>
          </Button>
        </ScrapbookCard>

        <ScrapbookCard>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Happiness note</p>
          <p className="mt-2 text-sm italic text-muted-foreground">
            {d.randomHappiness ? `"${d.randomHappiness}"` : "Add a note to the jar."}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/happiness">Open the jar</Link>
          </Button>
        </ScrapbookCard>

        <ScrapbookCard>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent unlocks</p>
          {d.achievements.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {d.achievements.map((a) => (
                <li key={a.achievement_code}>{a.achievement_code.replace(/-/g, " ")}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Keep making memories together.</p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/achievements">Achievements</Link>
          </Button>
        </ScrapbookCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrapbookCard>
          <h2 className="font-display text-lg">Recent memories</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(d.memories.length ? d.memories : []).map((m) => (
              <li key={m.id} className="flex justify-between gap-2 border-b border-border/50 pb-2">
                <span className="truncate">{m.caption || "Untitled moment"}</span>
                <span className="shrink-0 text-muted-foreground">{m.memory_date}</span>
              </li>
            ))}
            {!d.memories.length ? <li className="text-muted-foreground">No memories yet.</li> : null}
          </ul>
        </ScrapbookCard>

        <ScrapbookCard>
          <h2 className="font-display text-lg">Recent letters</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {d.letters.map((l) => (
              <li key={l.id} className="flex items-center gap-2">
                <Heart className="size-3 text-primary" aria-hidden />
                <span className="capitalize">{l.letter_type.replace(/_/g, " ")}</span>
                {l.sent_at ? <span className="text-muted-foreground">· {format(new Date(l.sent_at), "MMM d")}</span> : null}
              </li>
            ))}
            {!d.letters.length ? <li className="text-muted-foreground">Write your first letter.</li> : null}
          </ul>
          <Button asChild variant="link" className="mt-2 px-0">
            <Link to="/letters">Love Letters →</Link>
          </Button>
        </ScrapbookCard>
      </div>
    </div>
  );
}