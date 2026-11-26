import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TAGLINE, APP_TITLE } from "@/lib/navigation";
import { redirectIfAuthenticated } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { MAD } from "@/components/landing/mad-photos";

export const Route = createFileRoute("/login")({
  beforeLoad: () => redirectIfAuthenticated(),
  component: LoginPage,
  head: () => ({
    meta: [{ title: `Sign in — ${APP_TITLE}` }],
  }),
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    await navigate({ to: "/home" });
  }

  return (
    <div className="landing-bg flex min-h-dvh w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-brand-blush/40 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${MAD.login})` }}
          aria-hidden
        />
        <div className="relative z-10">
          <p className="font-accent text-2xl text-brand-rose">A little something, made with love</p>
          <h1 className="font-serif mt-6 max-w-md text-4xl font-semibold text-brand-burgundy">{APP_TITLE} ♡</h1>
          <p className="mt-4 max-w-sm text-brand-brown">{APP_TAGLINE}</p>
        </div>
        <figure className="polaroid relative z-10 mx-auto w-full max-w-sm rotate-[-1deg] shadow-xl">
          <img src={MAD.login} alt="Where our story began" className="aspect-[4/5] w-full object-cover" />
          <figcaption className="px-4 pb-4 pt-2 text-center font-accent text-lg text-brand-burgundy">
            little traditions ♡
          </figcaption>
        </figure>
        <p className="relative z-10 font-accent text-xl text-brand-taupe">Come inside — this world is just for us.</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 lg:mx-0">
              <Heart className="size-7 text-primary animate-heart" fill="currentColor" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">{APP_TAGLINE}</p>
          </div>
          <div className="editorial-paper relative mt-8 rounded-2xl p-8">
            <span className="washi-tape absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-sm" aria-hidden />
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-border/80 bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-border/80 bg-background/80"
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className={cn("w-full rounded-full", loading && "opacity-80")} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Enter our little world ♡"}
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Private space for Mallesh & Darshu only.
            </p>
          </div>
          <p className="mt-6 text-center text-sm lg:text-left">
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              ← Back to the love story
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}