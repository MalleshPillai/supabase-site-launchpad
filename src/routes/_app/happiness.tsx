import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import { HappinessJarVisual, PaperSlip } from "@/components/app/happiness-jar-visual";
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
  const [jarOpen, setJarOpen] = useState(false);

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

  const removeNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("happiness_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Note removed");
      setRandomNote(null);
      await qc.invalidateQueries({ queryKey: ["happiness"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function pullRandom() {
    const list = notes.data ?? [];
    if (!list.length) {
      setRandomNote(null);
      setJarOpen(false);
      return;
    }
    setJarOpen(true);
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
        <ScrapbookCard tape className="flex flex-col items-center text-center">
          <HappinessJarVisual open={jarOpen} className="mb-4" />
          <Button onClick={pullRandom} disabled={!list.length} className="rounded-full">
            Pick a random note
          </Button>
          {randomNote ? (
            <PaperSlip className="mt-6 max-w-sm">&ldquo;{randomNote}&rdquo;</PaperSlip>
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
        <NotesGrid list={list} userId={user?.id} onRemove={(id) => removeNote.mutate(id)} removing={removeNote.isPending} />
      )}
    </div>
  );
}

function NotesGrid({
  list,
  userId,
  onRemove,
  removing,
}: {
  list: { id: string; content: string; category: string; created_by: string }[];
  userId?: string;
  onRemove: (id: string) => void;
  removing: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((n) => (
        <ScrapbookCard key={n.id} className="rotate-0 even:-rotate-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs capitalize text-muted-foreground">{n.category.replace(/_/g, " ")}</p>
            {n.created_by === userId ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove note"
                disabled={removing}
                onClick={() => onRemove(n.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-sm">{n.content}</p>
        </ScrapbookCard>
      ))}
    </div>
  );
}