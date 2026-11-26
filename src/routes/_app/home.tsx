import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Heart, Sparkles, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appHeadTitle } from "@/routes/_app";
import { APP_TAGLINE } from "@/lib/navigation";
import {
  ErrorBlock,
  LoadingBlock,
  PolaroidFrame,
  ScrapbookCard,
  StatTile,
} from "@/components/app/scrapbook-ui";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchDailySurprise } from "@/lib/daily-surprise";
import { displayNameFor, fetchPairMembers } from "@/lib/pair";
import { getSignedUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_app/home")({
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
          supabase.from("memories").select("id, caption, photo_path, memory_date").order("created_at", { ascending: false }).limit(5),
          supabase.from("letters").select("id, letter_type, sent_at, status").eq("status", "sent").order("sent_at", { ascending: false }).limit(4),
          supabase.from("brownie_balances").select("user_id, balance"),
          supabase.from("bucket_list_items").select("id, is_completed"),
          supabase
            .from("user_achievements")
            .select("achievement_code, unlocked_at")
            .eq("user_id", userId!)
            .order("unlocked_at", { ascending: false })
            .limit(5),
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
  const today = format(new Date(), "EEEE, MMMM d");
  const partner = members?.find((m) => m.user_id !== userId);
  const myBalance = d.balances.find((b) => b.user_id === userId)?.balance ?? 0;
  const partnerBalance = d.balances.find((b) => b.user_id === partner?.user_id)?.balance ?? 0;

  return (
    <div className="min-h-full w-full space-y-8 pb-4">
      <header className="animate-fade-in grid gap-8 border-b border-border/50 pb-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="font-accent text-2xl text-primary sm:text-3xl">Good to see you, {displayNameFor(userId!, members)} ♡</p>
          <h1 className="font-serif mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
          {members?.map((m) => (
            <InputProfile key={m.user_id} name={m.display_name} isYou={m.user_id === userId} />
          ))}
        </div>
      </header>

      <motionRows className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <ScrapbookCard tape className="overflow-hidden p-0">
          <div className="grid min-h-[280px] lg:grid-cols-2">
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <Star className="size-3.5 text-primary" />
                Featured memory
              </div>
              {d.featured ? (
                <>
                  <p className="font-display mt-4 text-2xl text-foreground">
                    {d.featured.caption || "A moment worth keeping close."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {format(new Date(d.featured.memory_date), "MMMM d, yyyy")}
                  </p>
                  <Button asChild variant="link" className="mt-4 w-fit px-0">
                    <Link to="/memories">Browse the scrapbook →</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-accent mt-4 text-2xl text-primary">Your first polaroid awaits</p>
                  <p className="mt-2 text-sm text-muted-foreground">Upload a photograph and let it shine here.</p>
                  <Button asChild className="mt-6 w-fit">
                    <Link to="/memories">Add a memory</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="relative flex items-center justify-center bg-brand-cream/50 p-6">
              {d.featured ? (
                <PolaroidFrame
                  src={d.featuredUrl}
                  alt={d.featured.caption || "Memory"}
                  className="max-w-[220px] rotate-2 shadow-lg"
                />
              ) : (
                <div className="polaroid max-w-[200px] rotate-[-2deg] p-4">
                  <div className="aspect-[4/5] bg-brand-blush/30" />
                  <p className="font-accent pb-2 pt-2 text-center text-sm">waiting for us</p>
                </div>
              )}
            </div>
          </div>
        </ScrapbookCard>

        <div className="flex flex-col gap-6">
          <ScrapbookCard className="flex-1 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="font-display text-xl">Daily surprise</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {d.surprise?.content ?? "Open the app tomorrow for a new little delight."}
            </p>
          </ScrapbookCard>
          <ScrapbookCard>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Happiness jar</p>
            <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
              {d.randomHappiness ? `"${d.randomHappiness}"` : "Add a note to the jar."}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/happiness">Open the jar</Link>
            </Button>
          </ScrapbookCard>
        </div>
      </motionRows>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Your brownies" value={myBalance} href="/brownies" action="Brownie Bank" accent />
        <StatTile
          label="Partner brownies"
          value={partnerBalance}
          href="/brownies"
          action="Send appreciation"
          sub={partner?.display_name}
        />
        <StatTile
          label="Bucket list"
          value={`${d.bucketCompleted}/${d.bucketTotal}`}
          href="/bucket-list"
          action="Our list"
          footer={<Progress value={d.bucketProgress} className="mt-3" />}
        />
        <StatTile
          label="Achievements"
          value={d.achievements.length}
          href="/achievements"
          action="View badges"
          footer={
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {d.achievements.slice(0, 2).map((a) => (
                <li key={a.achievement_code} className="truncate capitalize">
                  {a.achievement_code.replace(/-/g, " ")}
                </li>
              ))}
            </ul>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrapbookCard>
          <h2 className="font-display text-xl">Recent memories</h2>
          <ul className="mt-4 divide-y divide-border/50">
            {(d.memories.length ? d.memories : []).map((m) => (
              <li key={m.id} className="flex justify-between gap-3 py-3 text-sm">
                <span className="truncate font-medium">{m.caption || "Untitled moment"}</span>
                <span className="shrink-0 text-muted-foreground">{m.memory_date}</span>
              </li>
            ))}
            {!d.memories.length ? <li className="py-4 text-muted-foreground">No memories yet.</li> : null}
          </ul>
        </ScrapbookCard>

        <ScrapbookCard>
          <h2 className="font-display text-xl">Recent letters</h2>
          <ul className="mt-4 space-y-3">
            {d.letters.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                <Heart className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="capitalize">{l.letter_type.replace(/_/g, " ")}</span>
                {l.sent_at ? (
                  <span className="text-muted-foreground">· {format(new Date(l.sent_at), "MMM d")}</span>
                ) : null}
              </li>
            ))}
            {!d.letters.length ? <li className="text-muted-foreground">Write your first letter.</li> : null}
          </ul>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link to="/letters">Love Letters →</Link>
          </Button>
        </ScrapbookCard>
      </div>
    </div>
  );
}

function motionRows({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("animate-fade-in", className)}>{children}</div>;
}

function InputProfile({ name, isYou }: { name: string; isYou: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
      <Avatar className="size-10 border border-border">
        <AvatarImage src={undefined} alt="" />
        <AvatarFallback className="bg-brand-blush/40 text-brand-burgundy">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{isYou ? "You" : "Your person"}</p>
      </div>
    </div>
  );
}