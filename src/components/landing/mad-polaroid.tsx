import { cn } from "@/lib/utils";

export function MadPolaroid({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("polaroid shadow-lg transition-transform hover:-rotate-1", className)}>
      <div className="aspect-[4/5] overflow-hidden bg-muted">
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" decoding="async" />
      </div>
      {caption ? (
        <figcaption className="px-3 pb-3 pt-2 text-center font-accent text-sm text-foreground/90">{caption}</figcaption>
      ) : null}
    </figure>
  );
}