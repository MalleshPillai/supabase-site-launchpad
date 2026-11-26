import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { appHeadTitle } from "@/routes/_app";
import { ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl, uploadPrivateFile } from "@/lib/storage";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => appHeadTitle("Settings"),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name);
      setBio(profile.data.bio);
    }
  }, [profile.data]);

  const { data: avatarUrl } = useQuery({
    queryKey: ["avatar", profile.data?.avatar_path],
    enabled: Boolean(profile.data?.avatar_path),
    queryFn: () => getSignedUrl("profiles", profile.data!.avatar_path!),
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["pair-members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not signed in");
      const { path, error: uploadError } = await uploadPrivateFile("profiles", user.id, file);
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Photo updated");
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["avatar"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile.isLoading) return <LoadingBlock />;
  if (profile.error) return <ErrorBlock message="Could not load settings." />;

  const initials = (displayName || "You").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Settings" description="Your corner of our little world." />

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrapbookCard tape>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border">
              <AvatarImage src={avatarUrl ?? undefined} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary">
                Change photo
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="mt-1 max-w-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar.mutate(file);
                }}
              />
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Short bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280} />
            </div>
            <Button type="submit" disabled={saveProfile.isPending}>
              Save profile
            </Button>
          </form>
        </ScrapbookCard>

        <ScrapbookCard>
          <h2 className="font-display text-lg">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-0.5 break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Privacy</dt>
              <dd className="mt-0.5 text-muted-foreground">
                This site is private to two authorized accounts. Content is protected by Supabase RLS.
              </dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-6" onClick={() => void signOut()}>
            Log out
          </Button>
        </ScrapbookCard>
      </div>
    </div>
  );
}