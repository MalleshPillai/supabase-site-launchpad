import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/landing-page";
import { APP_TAGLINE, APP_TITLE } from "@/lib/navigation";

export const Route = createFileRoute("/")({
  component: PublicLanding,
  // Public route — never run the authenticated app layout guard for `/`.
  staticData: { access: "public" as const },
  head: () => ({
    meta: [
      { title: `${APP_TITLE} ♡` },
      { name: "description", content: APP_TAGLINE },
    ],
  }),
});

function PublicLanding() {
  return <LandingPage />;
}