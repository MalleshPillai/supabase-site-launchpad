import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/login" });
  }

  const { data: membership, error } = await supabase
    .from("relationship_members")
    .select("user_id, display_name")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw redirect({ to: "/login" });
  }

  if (!membership) {
    await supabase.auth.signOut();
    throw redirect({ to: "/login" });
  }

  return { session, userId: session.user.id, displayName: membership.display_name };
}

export async function redirectIfAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    throw redirect({ to: "/" });
  }
}