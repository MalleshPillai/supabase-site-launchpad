import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HappinessJarVisual({
  open,
  className,
}: {
  open?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto h-52 w-36", className)} aria-hidden>
      <div
        className={cn(
          "absolute left-1/2 top-0 h-4 w-20 -translate-x-1/2 rounded-sm border border-primary/30 bg-brand-cream shadow-sm transition-transform duration-500",
          open && "-translate-y-2 rotate-[-8deg]",
        )}
      />
      <div className="absolute bottom-0 left-0 right-0 h-44 rounded-b-[2.5rem] border-2 border-primary/25 bg-gradient-to-b from-brand-cream/30 via-brand-blush/20 to-primary/15 shadow-inner">
        <div className="absolute inset-x-3 top-6 h-24 rounded-b-[1.5rem] border border-primary/10 bg-white/10" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-accent text-3xl text-primary">♡</div>
      </div>
      {open ? (
        <p className="absolute -right-4 top-12 w-24 rounded bg-[#fffef9] p-2 text-[10px] italic shadow-md animate-fade-in">
          a little smile
        </p>
      ) : null}
    </div>
  );
}

export function PaperSlip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border/60 bg-[#fffef9] px-4 py-3 text-sm italic shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}