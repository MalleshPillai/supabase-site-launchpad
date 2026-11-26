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

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <ScrapbookCard tape>
          <p className="text-xs text-muted-foreground">Your balance</p>
          <p className="font-display text-5xl text-primary">{myBalance}</p>
        </ScrapbookCard>
        <ScrapbookCard>
          <p className="text-xs text-muted-foreground">{partner?.display_name ?? "Partner"}&apos;s balance</p>
          <p className="font-display text-5xl text-foreground/80">{partnerBalance}</p>
        </ScrapbookCard>
      </div>

      <ScrapbookCard>
        <h2 className="font-display text-lg">Recent activity</h2>
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