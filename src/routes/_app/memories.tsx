import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PolaroidFrame,
  ScrapbookCard,
} from "@/components/app/scrapbook-ui";
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
import type { Tables } from "@/integrations/supabase/types";
import { getSignedUrl, removeStorageFile, uploadPrivateFile } from "@/lib/storage";

export const Route = createFileRoute("/_app/memories")({
  component: MemoriesPage,
  head: () => appHeadTitle("Our Memories"),
});

type MemoryRow = Tables<"memories">;

function MemoryPhoto({ path, alt, caption }: { path: string; alt: string; caption?: string }) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["memory-photo", path],
    queryFn: () => getSignedUrl("memories", path),
  });
  if (isLoading) return <div className="aspect-[4/5] animate-pulse bg-muted" />;
  return <PolaroidFrame src={url} alt={alt} caption={caption} />;
}

function MemoriesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [memoryDate, setMemoryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState("");
  const [selected, setSelected] = useState<MemoryRow | null>(null);

  const memories = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("memory_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMemory = useMutation({
    mutationFn: async () => {
      if (!user || !file) throw new Error("Choose a photo first.");
      const { path, error: uploadError } = await uploadPrivateFile("memories", user.id, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("memories").insert({
        uploaded_by: user.id,
        photo_path: path,
        caption: caption.trim(),
        memory_date: memoryDate,
        location: location.trim(),
      });
      if (error) {
        await removeStorageFile("memories", path);
        throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Memory saved ♡");
      setOpen(false);
      setFile(null);
      setCaption("");
      await qc.invalidateQueries({ queryKey: ["memories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMemory = useMutation({
    mutationFn: async (memory: MemoryRow) => {
      const { error } = await supabase.from("memories").delete().eq("id", memory.id);
      if (error) throw error;
      await removeStorageFile("memories", memory.photo_path);
    },
    onSuccess: async () => {
      toast.success("Memory removed");
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ["memories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (memories.isLoading) return <LoadingBlock />;
  if (memories.error) return <ErrorBlock message="Could not load memories." />;

  const list = memories.data ?? [];

  return (
    <div>
      <PageHeader
        title="Our Memories"
        description="Polaroids from our little world — each one a page in our scrapbook."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <ImagePlus className="size-4" />
                Add memory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">New memory</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createMemory.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={memoryDate} onChange={(e) => setMemoryDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc">Location</Label>
                    <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" disabled={createMemory.isPending || !file}>
                  Save to scrapbook
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {!list.length ? (
        <EmptyState title="No memories yet" description="Upload your first photograph together." />
      ) : (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3 xl:columns-4">
          {list.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className="mb-4 block w-full break-inside-avoid text-left"
              style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}
              onClick={() => setSelected(m)}
            >
              <MemoryPhoto
                path={m.photo_path}
                alt={m.caption || "Memory"}
                caption={m.caption || format(new Date(m.memory_date), "MMM d, yyyy")}
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{selected.caption || "Our moment"}</DialogTitle>
              </DialogHeader>
              <MemoryPhoto path={selected.photo_path} alt="" />
              <p className="text-sm text-muted-foreground">
                {format(new Date(selected.memory_date), "MMMM d, yyyy")}
                {selected.location ? ` · ${selected.location}` : ""}
              </p>
              {user?.id === selected.uploaded_by ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => deleteMemory.mutate(selected)}
                  disabled={deleteMemory.isPending}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}