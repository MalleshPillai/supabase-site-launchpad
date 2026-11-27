import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/bucket-list")({
  component: BucketListPage,
  head: () => appHeadTitle("Our Bucket List"),
});

const CATEGORIES = [
  "places",
  "food",
  "adventures",
  "movies",
  "experiences",
  "personal_goals",
  "travel",
  "custom",
] as const;

function BucketListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [showDone, setShowDone] = useState(true);

  const items = useQuery({
    queryKey: ["bucket-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bucket_list_items")
        .select("*")
        .order("is_completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("bucket_list_items").insert({
        added_by: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority: "medium",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Wish added");
      setTitle("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["bucket-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from("bucket_list_items")
        .update({
          is_completed: !isCompleted,
          completed_by: !isCompleted ? user!.id : null,
          completed_at: !isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bucket-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bucket_list_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Wish removed");
      await qc.invalidateQueries({ queryKey: ["bucket-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (items.isLoading) return <LoadingBlock />;
  if (items.error) return <ErrorBlock message="Could not load bucket list." />;

  const list = items.data ?? [];
  const completed = list.filter((i) => i.is_completed).length;
  const progress = list.length ? Math.round((completed / list.length) * 100) : 0;
  const visible = showDone ? list : list.filter((i) => !i.is_completed);

  return (
    <div>
      <PageHeader title="Our Bucket List" description="Wishes we'll check off together." />

      <ScrapbookCard className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {completed} of {list.length} completed
            </p>
            <Progress value={progress} className="mt-2 max-w-xs" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={showDone} onCheckedChange={(v) => setShowDone(Boolean(v))} />
            Show completed
          </label>
        </div>
      </ScrapbookCard>

      <ScrapbookCard className="mb-8" tape>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addItem.mutate();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What do we want to do?</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={addItem.isPending}>
              Add wish
            </Button>
          </div>
        </form>
      </ScrapbookCard>

      {!visible.length ? (
        <EmptyState title="Nothing on the list yet" description="Dream up something fun together." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((item) => (
            <li key={item.id}>
              <ScrapbookCard
                className={cn(item.is_completed && "border-primary/30 bg-primary/5")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn("font-display text-lg", item.is_completed && "line-through opacity-70")}>
                      {item.title}
                    </p>
                    {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
                      onClick={() => toggleComplete.mutate({ id: item.id, isCompleted: item.is_completed })}
                    >
                      <CheckCircle2 className={cn("size-5", item.is_completed && "text-primary")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove wish"
                      disabled={removeItem.isPending}
                      onClick={() => removeItem.mutate(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </ScrapbookCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}