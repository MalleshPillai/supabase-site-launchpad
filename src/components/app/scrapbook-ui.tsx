import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ScrapbookCard({
  className,
  children,
  tape,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  tape?: boolean;
  onClick?: () => void;
}) {
  return (
    <FadeInWrap
      className={cn(
        "scrapbook-card relative rounded-2xl border border-border/80 bg-card p-5 shadow-sm",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {tape ? (
        <span
          className="pointer-events-none absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 rounded-sm bg-accent/80 opacity-90 shadow-sm"
          aria-hidden
        />
      ) : null}
      {children}
    </FadeInWrap>
  );
}

function FadeInWrap({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={cn("animate-fade-in", className)} onClick={onClick}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <ScrapbookCard className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-accent text-2xl text-primary">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </ScrapbookCard>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <ScrapbookCard className="border-destructive/30 bg-destructive/5 text-center text-sm text-destructive">
      {message}
    </ScrapbookCard>
  );
}

export function PolaroidFrame({
  src,
  alt,
  caption,
  className,
}: {
  src: string | null;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("polaroid rotate-0 transition-transform hover:-rotate-1", className)}>
      <div className="aspect-[4/5] overflow-hidden bg-muted">
        {src ? (
          <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="px-3 pb-3 pt-2 text-center font-accent text-sm text-foreground/90">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}