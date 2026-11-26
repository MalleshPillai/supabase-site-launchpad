import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { appHeadTitle } from "@/routes/_app";
import { ErrorBlock, LoadingBlock, PageHeader, ScrapbookCard } from "@/components/app/scrapbook-ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/games")({
  component: GamesPage,
  head: () => appHeadTitle("Little Games"),
});

const WOULD_YOU_RATHER = [
  ["Sunrise picnic", "Stargazing night"],
  ["Cook together", "Surprise takeout"],
  ["Road trip", "Cozy home day"],
  ["Handwritten letter", "Voice message"],
] as const;

const KNOW_ME = [
  "What's my comfort food?",
  "What's a song that reminds me of us?",
  "What's my ideal Sunday?",
  "What was I most nervous about on our first date?",
];

const ICEBREAKERS = [
  "What's one tiny thing I did this week that made you smile?",
  "If we could teleport anywhere for an hour, where would we go?",
  "What memory should we recreate soon?",
  "What's a new tradition we should start?",
];

function GamesPage() {
  const [wyrIndex, setWyrIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [memoryScore, setMemoryScore] = useState(0);
  const [memoryRound, setMemoryRound] = useState(0);
  const [iceIndex, setIceIndex] = useState(0);

  const questions = useQuery({
    queryKey: ["game-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_questions")
        .select("id, prompt, question_type")
        .eq("is_active", true)
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const dbPrompts = useMemo(
    () => questions.data?.filter((q) => q.question_type === "daily_question").map((q) => q.prompt) ?? [],
    [questions.data],
  );

  const icebreakers = dbPrompts.length ? dbPrompts : ICEBREAKERS;

  if (questions.isLoading) return <LoadingBlock />;
  if (questions.error) return <ErrorBlock message="Could not load games." />;

  const wyr = WOULD_YOU_RATHER[wyrIndex % WOULD_YOU_RATHER.length]!;

  function nextMemoryRound(correct: boolean) {
    if (correct) setMemoryScore((s) => s + 1);
    setMemoryRound((r) => r + 1);
  }

  return (
    <div>
      <PageHeader title="Little Games" description="Playful prompts for two — no scoreboards required." />

      <Tabs defaultValue="wyr">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="wyr">Would you rather</TabsTrigger>
          <TabsTrigger value="know">Know me?</TabsTrigger>
          <TabsTrigger value="memory">Memory quiz</TabsTrigger>
          <TabsTrigger value="random">Random question</TabsTrigger>
        </TabsList>

        <TabsContent value="wyr" className="mt-6">
          <ScrapbookCard tape className="text-center">
            <p className="font-display text-xl">Would you rather…</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Button variant="outline" className="h-auto py-6 text-base" onClick={() => setWyrIndex((i) => i + 1)}>
                {wyr[0]}
              </Button>
              <Button variant="outline" className="h-auto py-6 text-base" onClick={() => setWyrIndex((i) => i + 1)}>
                {wyr[1]}
              </Button>
            </div>
            <Button className="mt-6" variant="secondary" onClick={() => setWyrIndex((i) => i + 1)}>
              Next pair
            </Button>
          </ScrapbookCard>
        </TabsContent>

        <TabsContent value="know" className="mt-6">
          <ScrapbookCard>
            <p className="font-accent text-2xl text-primary">How well do you know me?</p>
            <p className="mt-4 text-lg">{KNOW_ME[quizIndex % KNOW_ME.length]}</p>
            <p className="mt-2 text-sm text-muted-foreground">Talk it out — compare answers aloud.</p>
            <Button className="mt-6" onClick={() => setQuizIndex((i) => i + 1)}>
              Next question
            </Button>
          </ScrapbookCard>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <ScrapbookCard>
            <p className="font-display text-xl">Memory round {memoryRound + 1}</p>
            <p className="mt-2 text-muted-foreground">Did you both remember the same detail about a recent moment?</p>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => nextMemoryRound(true)}>We matched</Button>
              <Button variant="outline" onClick={() => nextMemoryRound(false)}>
                Not quite
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Matches this session: {memoryScore}</p>
          </ScrapbookCard>
        </TabsContent>

        <TabsContent value="random" className="mt-6">
          <ScrapbookCard tape className="text-center">
            <p className="font-display text-2xl">{icebreakers[iceIndex % icebreakers.length]}</p>
            <Button className="mt-6" onClick={() => setIceIndex((i) => i + 1)}>
              Another question
            </Button>
          </ScrapbookCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}