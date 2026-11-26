import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/happiness")({
  component: HappinessPage,
  head: () => appHeadTitle("Happiness Jar"),
});

const CATEGORIES = [
  "appreciation",
  "favourite_things",
  "funny_moments",
  "happy_things",
  "compliments",
  "memories",
  "encouragement",
  "custom",
] as const;

function HappinessPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [randomNote, setRandomNote] = useState<string | null>(null);

  const notes = useQuery({
    queryKey: ["happiness"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("happiness_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("happiness_notes").insert({
        created_by: user.id,
        content: content.trim(),
        category,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Note tucked in the jar ♡");
      setContent("");
      await qc.invalidateQueries({ queryKey: ["happiness"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function pullRandom() {
    const list = notes.data ?? [];
    if (!list.length) {
      setRandomNote(null);
      return;
    }
    const pick = list[Math.floor(Math.random() * list.length)];
    setRandomNote(pick?.content ?? null);
  }

  if (notes.isLoading) return <LoadingBlock />;
  if (notes.error) return <ErrorBlock message="Could not open the jar." />;

  const list = notes.data ?? [];

  return (
    <div>
      <PageHeader title="Happiness Jar" description="Tiny slips of joy, saved for rainy days." />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ScrapbookCard tape className="text-center">
          <div className="mx-auto mb-4 flex h-40 w-32 items-end justify-center rounded-b-3xl border-2 border-primary/40 bg-gradient-to-b from-transparent to-primary/10">
            <div className="mb-2 font-accent text-4xl text-primary">♡</div>
          </div>
          <Button onClick={pullRandom} disabled={!list.length}>
            Pick a random note
          </Button>
          {randomNote ? (
            <p className="mt-4 rounded-xl bg-background p-4 text-sm italic shadow-inner">&ldquo;{randomNote}&rdquo;</p>
          ) : list.length ? null : (
            <p className="mt-4 text-sm text-muted-foreground">The jar is empty — add the first note.</p>
          )}
        </ScrapbookCard>

        <ScrapbookCard>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              addNote.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your happy note</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required maxLength={500} />
            </div>
            <Button type="submit" disabled={addNote.isPending}>
              Drop in jar
            </Button>
          </form>
        </ScrapbookCard>
      </div>

      {!list.length ? (
        <EmptyState title="No notes yet" description="Write something that made you smile." />
      ) : (
        <NotesGrid list={list} />
      )}
    </div>
  );
}

function NotesGrid({ list }: { list: { id: string; content: string; category: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((n) => (
        <ScrapbookCard key={n.id} className="rotate-0 even:-rotate-1">
          <p className="text-xs capitalize text-muted-foreground">{n.category.replace(/_/g, " ")}</p>
          <p className="mt-2 text-sm">{n.content}</p>
        </ScrapbookCard>
      ))}
    </div>
  );
}