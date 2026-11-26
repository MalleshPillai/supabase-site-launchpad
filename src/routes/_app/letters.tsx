import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MailPlus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { displayNameFor, fetchPairMembers, usePartner } from "@/lib/pair";

export const Route = createFileRoute("/_app/letters")({
  component: LettersPage,
  head: () => appHeadTitle("Love Letters"),
});

const LETTER_TYPES = [
  "love_letter",
  "open_when_happy",
  "open_when_sad",
  "open_when_bored",
  "open_when_miss_me",
  "open_when_motivation",
  "birthday",
  "custom",
] as const;

type LetterEnvelope = Tables<"letters">;

function LettersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [letterType, setLetterType] = useState<string>("love_letter");
  const [unlockAt, setUnlockAt] = useState("");
  const [openLetter, setOpenLetter] = useState<LetterEnvelope | null>(null);

  const members = useQuery({ queryKey: ["pair-members"], queryFn: fetchPairMembers });
  const partner = usePartner(user?.id, members.data);

  const letters = useQuery({
    queryKey: ["letters", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const letterContent = useQuery({
    queryKey: ["letter-content", openLetter?.id],
    enabled: Boolean(openLetter?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letter_contents")
        .select("*")
        .eq("letter_id", openLetter!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!partner || !user) throw new Error("Missing partner.");
      const unlock = unlockAt ? new Date(unlockAt).toISOString() : new Date().toISOString();
      const { error } = await supabase.rpc("save_letter_draft", {
        p_letter_id: null as unknown as string,
        p_recipient_id: partner.user_id,
        p_letter_type: letterType,
        p_title: title.trim(),
        p_body: body.trim(),
        p_unlock_at: unlock,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Draft saved");
      setTitle("");
      setBody("");
      await qc.invalidateQueries({ queryKey: ["letters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendLetter = useMutation({
    mutationFn: async (letterId: string) => {
      const { error } = await supabase.rpc("send_letter", { p_letter_id: letterId });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Letter sent ♡");
      await qc.invalidateQueries({ queryKey: ["letters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markRead = useMutation({
    mutationFn: async (letterId: string) => {
      const { error } = await supabase.from("letters").update({ read_at: new Date().toISOString() }).eq("id", letterId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["letters"] });
    },
  });

  if (letters.isLoading) return <LoadingBlock />;
  if (letters.error) return <ErrorBlock message="Could not load letters." />;

  const list = letters.data ?? [];
  const sent = list.filter((l) => l.sender_id === user?.id);
  const received = list.filter((l) => l.recipient_id === user?.id && l.status === "sent");
  const drafts = sent.filter((l) => l.status === "draft");

  return (
    <div>
      <PageHeader title="Love Letters" description="Paper hearts, sealed with care — some for now, some for later." />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ScrapbookCard tape>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
            <MailPlus className="size-5 text-primary" />
            Write a letter
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveDraft.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={letterType} onValueChange={setLetterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LETTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} required />
            </div>
            <div className="space-y-2">
              <Label>Unlock at (optional — schedule delivery)</Label>
              <Input type="datetime-local" value={unlockAt} onChange={(e) => setUnlockAt(e.target.value)} />
            </div>
            <Button type="submit" disabled={saveDraft.isPending || !partner}>
              Save draft
            </Button>
          </form>
        </ScrapbookCard>

        <ScrapbookCard>
          <h2 className="font-display text-xl">Your drafts</h2>
          {drafts.length ? (
            <ul className="mt-3 space-y-2">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{d.letter_type.replace(/_/g, " ")}</span>
                  <Button size="sm" onClick={() => sendLetter.mutate(d.id)} disabled={sendLetter.isPending}>
                    Send
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No drafts yet.</p>
          )}
        </ScrapbookCard>
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-4">
          {received.length ? (
            <LettersList list={received} userId={user?.id} members={members.data} onOpen={setOpenLetter} />
          ) : (
            <EmptyState title="No letters yet" description="When they send one, it will appear here." />
          )}
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          <LettersList list={sent.filter((l) => l.status === "sent")} userId={user?.id} members={members.data} onOpen={setOpenLetter} />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(openLetter)}
        onOpenChange={(v) => {
          if (!v) setOpenLetter(null);
        }}
      >
        <DialogContent className="max-w-lg">
          {openLetter ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display capitalize">
                  {openLetter.letter_type.replace(/_/g, " ")}
                </DialogTitle>
              </DialogHeader>
              {letterContent.isLoading ? (
                <LoadingBlock />
              ) : letterContent.data ? (
                <div className="scrapbook-card rounded-xl border bg-background/80 p-6">
                  <p className="font-display text-2xl">{letterContent.data.title}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{letterContent.data.body}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {openLetter.sent_at ? format(new Date(openLetter.sent_at), "MMMM d, yyyy") : "Draft"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">This letter is not unlocked yet or content is unavailable.</p>
              )}
              {openLetter.recipient_id === user?.id && !openLetter.read_at ? (
                <Button onClick={() => markRead.mutate(openLetter.id)}>Mark as read</Button>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LettersList({
  list,
  userId,
  members,
  onOpen,
}: {
  list: LetterEnvelope[];
  userId?: string;
  members?: Awaited<ReturnType<typeof fetchPairMembers>>;
  onOpen: (l: LetterEnvelope) => void;
}) {
  if (!list.length) return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {list.map((l) => (
        <ScrapbookCard key={l.id} className="cursor-pointer transition hover:shadow-md" onClick={() => onOpen(l)}>
          <p className="capitalize">{l.letter_type.replace(/_/g, " ")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {l.sender_id === userId ? `To ${displayNameFor(l.recipient_id, members)}` : `From ${displayNameFor(l.sender_id, members)}`}
          </p>
          {new Date(l.unlock_at) > new Date() ? (
            <p className="mt-2 text-xs text-primary">Opens {format(new Date(l.unlock_at), "MMM d, h:mm a")}</p>
          ) : null}
        </ScrapbookCard>
      ))}
    </ul>
  );
}