import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TAGLINE, APP_TITLE } from "@/lib/navigation";
import { redirectIfAuthenticated } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { ScrapbookCard } from "@/components/app/scrapbook-ui";

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
    await navigate({ to: "/" });
  }

  return (
    <div className="scrapbook-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Heart className="size-7 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground">{APP_TITLE} ♡</h1>
          <p className="mt-2 font-accent text-lg text-muted-foreground">{APP_TAGLINE}</p>
        </div>
        <ScrapbookCard className="mt-8 p-8" tape>
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
                className="bg-background"
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
                className="bg-background"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Enter our world"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Private space for Mallesh & Darshu only. No sign-up — use your existing account.
          </p>
        </ScrapbookCard>
      </div>
    </div>
  );
}