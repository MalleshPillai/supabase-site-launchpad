import { supabase } from "@/integrations/supabase/client";

const SURPRISE_ANCHOR_MS = Date.UTC(2026, 0, 1);

export type DailySurprise = {
  surprise_date: string;
  prompt_type: string;
  content: string;
  memory_id: string | null;
};

function utcDayStartMs(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function promptIndexForToday(promptCount: number, today = new Date()): number {
  const dayOffset = Math.floor((utcDayStartMs(today) - SURPRISE_ANCHOR_MS) / 86_400_000);
  return ((dayOffset % promptCount) + promptCount) % promptCount;
}

export async function fetchDailySurprise(): Promise<DailySurprise | null> {
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_daily_surprise");
  if (!rpcError && rpcData?.[0]) {
    return rpcData[0];
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: stored } = await supabase
    .from("daily_surprises")
    .select("surprise_date, memory_id, daily_surprise_prompts (prompt_type, content)")
    .eq("surprise_date", today)
    .maybeSingle();

  if (stored?.daily_surprise_prompts) {
    const prompt = stored.daily_surprise_prompts as { prompt_type: string; content: string };
    return {
      surprise_date: stored.surprise_date,
      prompt_type: prompt.prompt_type,
      content: prompt.content,
      memory_id: stored.memory_id,
    };
  }

  const { data: prompts, error: promptsError } = await supabase
    .from("daily_surprise_prompts")
    .select("prompt_type, content")
    .order("sequence_no");

  if (promptsError || !prompts?.length) return null;

  const pick = prompts[promptIndexForToday(prompts.length)]!;
  return {
    surprise_date: today,
    prompt_type: pick.prompt_type,
    content: pick.content,
    memory_id: null,
  };
}