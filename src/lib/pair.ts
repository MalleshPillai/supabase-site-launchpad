import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PairMember = {
  user_id: string;
  display_name: string;
};

export async function fetchPairMembers(): Promise<PairMember[]> {
  const { data, error } = await supabase.rpc("get_pair_member_display_names");
  if (error) throw error;
  return data ?? [];
}

export function usePairMembers() {
  return useQuery({
    queryKey: ["pair-members"],
    queryFn: fetchPairMembers,
    staleTime: 60_000,
  });
}

export function usePartner(userId: string | undefined, members: PairMember[] | undefined) {
  if (!userId || !members) return null;
  return members.find((m) => m.user_id !== userId) ?? null;
}

export function displayNameFor(
  userId: string,
  members: PairMember[] | undefined,
  fallback = "Someone special",
): string {
  const member = members?.find((m) => m.user_id === userId);
  return member?.display_name ?? fallback;
}