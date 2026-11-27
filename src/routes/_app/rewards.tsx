import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  ScrapbookCard,
} from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { displayNameFor, fetchPairMembers } from "@/lib/pair";

export const Route = createFileRoute("/_app/rewards")({
  component: RewardsPage,
  head: () => appHeadTitle("Little Rewards"),
});

const REWARD_CATEGORIES = [
  "food",
  "dates",
  "experiences",
  "gifts",
  "surprises",
  "personal_wishes",
  "custom",
] as const;

function RewardsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<Tables<"rewards"> | null>(null);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(REWARD_CATEGORIES[0]);
  const [pointsCost, setPointsCost] = useState(10);

  const members = useQuery({ queryKey: ["pair-members"], queryFn: fetchPairMembers });

  const { data, isLoading, error } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const [rewards, redemptions, balance] = await Promise.all([
        supabase.from("rewards").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("redemption_requests").select("*").order("created_at", { ascending: false }).limit(20),
        user ? supabase.from("brownie_balances").select("balance").eq("user_id", user.id).maybeSingle() : null,
      ]);
      if (rewards.error) throw rewards.error;
      if (redemptions.error) throw redemptions.error;
      return {
        rewards: rewards.data ?? [],
        redemptions: redemptions.data ?? [],
        balance: balance?.data?.balance ?? 0,
      };
    },
    enabled: Boolean(user),
  });

  const redeem = useMutation({
    mutationFn: async (reward: Tables<"rewards">) => {
      const { error } = await supabase.rpc("request_reward", {
        p_reward_id: reward.id,
        p_message: message.trim(),
        p_idempotency_key: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reward requested ♡");
      setConfirm(null);
      setMessage("");
      await qc.invalidateQueries({ queryKey: ["rewards"] });
      await qc.invalidateQueries({ queryKey: ["brownies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("accept_reward_request", { p_request_id: requestId });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Request accepted");
      await qc.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decline = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("decline_reward_request", { p_request_id: requestId });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Request declined");
      await qc.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addReward = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (pointsCost < 1) throw new Error("Brownie cost must be at least 1");
      const { error } = await supabase.from("rewards").insert({
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        points_cost: pointsCost,
        category,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reward added to the shop ♡");
      setTitle("");
      setDescription("");
      setPointsCost(10);
      await qc.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rewards").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reward removed");
      await qc.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock message="Could not load rewards." />;

  const rewards = data?.rewards ?? [];
  const balance = data?.balance ?? 0;

  return (
    <div>
      <PageHeader
        title="Little Rewards"
        description="Redeem brownies for sweet promises and shared adventures."
      />
      <p className="mb-6 text-sm text-muted-foreground">
        You have <strong className="text-primary">{balance}</strong> brownies to spend.
      </p>

      <ScrapbookCard className="mb-8" tape>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addReward.mutate();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward-title">Reward title</Label>
              <Input
                id="reward-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Movie night, your pick"
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-description">What’s included?</Label>
              <Textarea
                id="reward-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional details"
                maxLength={1000}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-points">Brownie cost</Label>
              <Input
                id="reward-points"
                type="number"
                min={1}
                max={9999}
                value={pointsCost}
                onChange={(e) => setPointsCost(Math.max(1, Number(e.target.value) || 1))}
                required
              />
            </div>
            <Button type="submit" disabled={addReward.isPending}>
              Add reward
            </Button>
          </div>
        </form>
      </ScrapbookCard>

      {!rewards.length ? (
        <EmptyState title="The shop is empty" description="Add a reward above — your partner can redeem it with brownies." />
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => {
            const canAfford = balance >= r.points_cost;
            const isOwn = r.created_by === user?.id;
            return (
              <ScrapbookCard key={r.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs capitalize text-muted-foreground">{r.category.replace(/_/g, " ")}</p>
                    <p className="font-display text-lg">{r.title}</p>
                  </div>
                  {isOwn ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove reward"
                      disabled={removeReward.isPending}
                      onClick={() => removeReward.mutate(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{r.description || "A little treat."}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Offered by {displayNameFor(r.created_by, members.data)}
                </p>
                <p className="mt-3 font-accent text-xl text-primary">{r.points_cost} brownies</p>
                <Button
                  className="mt-4"
                  disabled={!canAfford || isOwn}
                  onClick={() => setConfirm(r)}
                >
                  {isOwn ? "Your reward" : canAfford ? "Redeem" : "Not enough brownies"}
                </Button>
              </ScrapbookCard>
            );
          })}
        </div>
      )}

      <ScrapbookCard>
        <h2 className="font-display text-lg">Redemption history</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(data?.redemptions ?? []).map((req) => (
            <li key={req.id} className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {displayNameFor(req.requester_id, members.data)} · status: {req.status} · {req.points_cost} pts
              </span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{format(new Date(req.created_at), "MMM d")}</span>
                {req.reward_owner_id === user?.id && req.status === "pending" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => accept.mutate(req.id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decline.mutate(req.id)}>
                      Decline
                    </Button>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </ScrapbookCard>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Redeem {confirm?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will request {confirm?.points_cost} brownies from your balance after acceptance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Add a sweet note (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && redeem.mutate(confirm)} disabled={redeem.isPending}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}