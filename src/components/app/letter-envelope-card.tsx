import { format } from "date-fns";
import { Mail } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { displayNameFor, fetchPairMembers } from "@/lib/pair";
import { cn } from "@/lib/utils";

type LetterRow = Tables<"letters">;

export function LetterEnvelopeCard({
  letter,
  userId,
  members,
  onOpen,
}: {
  letter: LetterRow;
  userId?: string;
  members?: Awaited<ReturnType<typeof fetchPairMembers>>;
  onOpen: () => void;
}) {
  const locked = new Date(letter.unlock_at) > new Date();
  const unread = letter.recipient_id === userId && !letter.read_at && !locked;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative w-full text-left transition-transform hover:-translate-y-0.5",
        unread && "animate-fade-in",
      )}
    >
      <div
        className={cn(
          "editorial-paper relative overflow-hidden rounded-xl px-5 py-6",
          unread && "ring-1 ring-primary/30",
        )}
      >
        <div
          aria-hidden
          className="absolute -top-1 left-0 h-0 w-0 border-l-[140px] border-r-[140px] border-t-[44px] border-l-transparent border-r-transparent border-t-brand-blush/60"
        />
        <div className="relative z-10 mt-6 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg capitalize text-foreground group-hover:text-primary">
              {letter.letter_type.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {letter.sender_id === userId
                ? `To ${displayNameFor(letter.recipient_id, members)}`
                : `From ${displayNameFor(letter.sender_id, members)}`}
            </p>
          </div>
          <Mail className="size-5 shrink-0 text-primary/70" />
        </div>
        {locked ? (
          <p className="mt-3 text-xs text-primary">Opens {format(new Date(letter.unlock_at), "MMM d, h:mm a")}</p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Tap to open</p>
        )}
        {unread ? (
          <span className="absolute right-3 top-3 size-2 rounded-full bg-primary shadow-sm" aria-label="Unread" />
        ) : null}
      </div>
    </button>
  );
}