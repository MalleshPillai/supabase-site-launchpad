import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import { ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { displayNameFor, fetchPairMembers, usePartner } from "@/lib/pair";

export const Route = createFileRoute("/_app/brownies")({
  component: BrowniesPage,
  head: () => appHeadTitle("Brownie Bank"),
});

function BrowniesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const members = useQuery({ queryKey: ["pair-members"], queryFn: fetchPairMembers });
  const partner = usePartner(user?.id, members.data);

  const data = useQuery({
    queryKey: ["brownies"],
    queryFn: async () => {
      const [balances, txns] = await Promise.all([
        supabase.from("brownie_balances").select("user_id, balance"),
        supabase.from("brownie_transactions").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      if (balances.error) throw balances.error;
      if (txns.error) throw txns.error;
      return { balances: balances.data ?? [], txns: txns.data ?? [] };
    },
  });

  const award = useMutation({
    mutationFn: async () => {
      if (!partner) throw new Error("Partner not found.");
      const { error } = await supabase.rpc("award_brownies", {
        p_recipient_id: partner.user_id,
        p_points: points,
        p_reason: reason.trim() || "appreciation",
        p_message: message.trim(),
        p_idempotency_key: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Brownies sent ♡");
      setOpen(false);
      setReason("");
      setMessage("");
      await qc.invalidateQueries({ queryKey: ["brownies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetBank = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("reset_brownie_bank");
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Brownie bank reset — balances are back to zero ♡");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["brownies"] }),
        qc.invalidateQueries({ queryKey: ["home-dashboard"] }),
        qc.invalidateQueries({ queryKey: ["notifications-unread"] }),
        qc.invalidateQueries({ queryKey: ["achievements"] }),
      ]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (data.isLoading || members.isLoading) return <LoadingBlock />;
  if (data.error) return <ErrorBlock message="Could not load brownie bank." />;

  const myBalance = data.data!.balances.find((b) => b.user_id === user?.id)?.balance ?? 0;
  const partnerBalance = data.data!.balances.find((b) => b.user_id === partner?.user_id)?.balance ?? 0;

  return (
    <div>
      <PageHeader
        title="Brownie Bank"
        description="Little points for little acts of love."
        action={
          partner ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Give brownies</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Award brownies to {partner.display_name}</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    award.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. made me smile" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
                  </div>
                  <Button type="submit" disabled={award.isPending}>
                    Send
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ScrapbookCard tape className="bg-gradient-to-br from-primary/10 via-transparent to-transparent p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your balance</p>
          <p className="font-serif mt-2 text-6xl font-semibold text-primary tabular-nums lg:text-7xl">{myBalance}</p>
          <p className="font-accent mt-2 text-lg text-muted-foreground">brownies saved up</p>
        </ScrapbookCard>
        <ScrapbookCard className="p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {partner?.display_name ?? "Partner"}&apos;s balance
          </p>
          <p className="font-serif mt-2 text-6xl font-semibold text-foreground/85 tabular-nums lg:text-7xl">
            {partnerBalance}
          </p>
          <p className="font-accent mt-2 text-lg text-muted-foreground">sweet gestures counted</p>
        </ScrapbookCard>
      </div>

      <ScrapbookCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg">Recent activity</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={resetBank.isPending}>
                Reset brownie bank
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Reset everything?</AlertDialogTitle>
                <AlertDialogDescription>
                  This sets both balances to zero, clears all brownie transactions, pending reward redemptions, and
                  brownie-related notifications. It cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep balances</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => resetBank.mutate()}
                >
                  Reset to zero
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <ul className="mt-4 divide-y divide-border/60">
          {data.data!.txns.map((t) => (
            <li key={t.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:justify-between">
              <span>
                {displayNameFor(t.sender_id, members.data)} → {displayNameFor(t.recipient_id, members.data)}
                {t.reason ? ` · ${t.reason}` : ""}
              </span>
              <span className="text-muted-foreground">
                +{t.points} · {format(new Date(t.created_at), "MMM d")}
              </span>
            </li>
          ))}
          {!data.data!.txns.length ? <li className="py-4 text-muted-foreground">No transactions yet.</li> : null}
        </ul>
      </ScrapbookCard>
    </div>
  );
}