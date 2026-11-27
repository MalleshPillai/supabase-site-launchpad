import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/timeline")({
  component: TimelinePage,
  head: () => appHeadTitle("Our Timeline"),
});

const CATEGORIES = [
  "first_memories",
  "birthdays",
  "trips",
  "celebrations",
  "milestones",
  "special_dates",
  "personal_moments",
] as const;

function TimelinePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<string>(CATEGORIES[0]);

  const events = useQuery({
    queryKey: ["timeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("timeline_events").insert({
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate,
        category,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Moment added");
      setTitle("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["timeline"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timeline_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["timeline"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (events.isLoading) return <LoadingBlock />;
  if (events.error) return <ErrorBlock message="Could not load timeline." />;

  const list = events.data ?? [];

  return (
    <div>
      <PageHeader title="Our Timeline" description="Milestones stitched into a vertical scrapbook line." />

      <ScrapbookCard className="mb-8" tape>
        <form
          className="grid gap-4 lg:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addEvent.mutate();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
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
            <Button type="submit" disabled={addEvent.isPending}>
              Add to timeline
            </Button>
          </div>
        </form>
      </ScrapbookCard>

      {!list.length ? (
        <EmptyState title="Your story starts here" description="Add the moments that matter." />
      ) : (
        <ol className="relative border-l border-primary/30 pl-6">
          {list.map((ev) => (
            <li key={ev.id} className="mb-8 last:mb-0">
              <span className="absolute -left-2 mt-1.5 size-3 rounded-full border-2 border-background bg-primary" />
              <ScrapbookCard>
                <time className="text-xs uppercase tracking-wide text-primary">
                  {format(new Date(ev.event_date), "MMMM d, yyyy")}
                </time>
                <h3 className="font-display mt-1 text-xl">{ev.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{ev.description}</p>
                {ev.created_by === user?.id ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-3"
                    aria-label="Remove event"
                    onClick={() => removeEvent.mutate(ev.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </ScrapbookCard>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}