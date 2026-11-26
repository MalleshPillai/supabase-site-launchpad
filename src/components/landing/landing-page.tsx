import { Link } from "@tanstack/react-router";
import {
  Award,
  Bell,
  CalendarHeart,
  Candy,
  Gamepad2,
  Gift,
  Heart,
  Images,
  ListChecks,
  Mail,
  Settings,
  Smile,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { APP_TITLE } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { MAD } from "./mad-photos";
import { MadPolaroid } from "./mad-polaroid";
import { RevealSection } from "./reveal-section";

const LETTER_BODY = `Darshu,

I don't know if I can ever put everything I feel into words. Sometimes the smallest things become the biggest memories. A conversation, a silly moment, a random laugh, a little disagreement, or simply knowing that you're there.

I wanted to create something that belongs to us. Somewhere we can keep our memories, leave little surprises for each other, write letters whenever words feel easier on a screen, and save all the little things that make our story special.

So I made this little world.

It's not about having something perfect. It's about having something that's ours. A place we can return to, add new memories to, and watch our little collection grow.

Every corner of this website has a purpose, and every little detail was made with you in mind.

With all my love,
Mallesh ♡`;

const WHY_BLOCKS = [
  {
    title: "Memories",
    text: "Some moments deserve more than a place in our camera roll. Let's give them a home.",
  },
  {
    title: "Letters",
    text: "For the words we want to keep, the things we want to say, and the surprises we want to leave.",
  },
  {
    title: "Happiness",
    text: "A little jar of reminders that even on ordinary days, there are reasons to smile.",
  },
  {
    title: "Our future",
    text: "All the things we dream of doing together, one little promise at a time.",
  },
] as const;

const FEATURES = [
  {
    title: "Our Memories",
    description:
      "Every photograph has a story. Save our favourite moments, add little captions, and revisit the days we never want to forget.",
    to: "/memories",
    icon: Images,
    layout: "tall",
  },
  {
    title: "Brownie Bank",
    description:
      "Because appreciation deserves its own little currency. Earn brownies, send them to each other, and keep track of every sweet gesture.",
    to: "/brownies",
    icon: Candy,
    layout: "wide",
  },
  {
    title: "Little Rewards",
    description: "Turn those brownies into little rewards. A playful way to make each other smile.",
    to: "/rewards",
    icon: Gift,
    layout: "compact",
  },
  {
    title: "Love Letters",
    description:
      "Write letters, send them instantly, or schedule a surprise for another day. Some words deserve to arrive at just the right moment.",
    to: "/letters",
    icon: Mail,
    layout: "letter",
  },
  {
    title: "Our Timeline",
    description: "Take a walk through our story. From the moments that started everything to the memories we haven't made yet.",
    to: "/timeline",
    icon: CalendarHeart,
    layout: "timeline",
  },
  {
    title: "Happiness Jar",
    description: "Whenever one of us needs a smile, open the jar and find a little reminder of happiness.",
    to: "/happiness",
    icon: Smile,
    layout: "jar",
  },
  {
    title: "Our Bucket List",
    description: "All the places we want to visit, experiences we want to share, and little dreams we want to make real.",
    to: "/bucket-list",
    icon: ListChecks,
    layout: "wide",
  },
  {
    title: "Little Games",
    description: "Because having fun together should never get old. Play, laugh, challenge each other, and discover how well we know one another.",
    to: "/games",
    icon: Gamepad2,
    layout: "compact",
  },
  {
    title: "Achievements",
    description: "Celebrate our little milestones and collect special badges along the way.",
    to: "/achievements",
    icon: Award,
    layout: "compact",
  },
  {
    title: "Notifications",
    description: "Never miss a letter, a surprise, a brownie, or a new memory.",
    to: "/notifications",
    icon: Bell,
    layout: "compact",
  },
  {
    title: "Settings",
    description: "Our little space, our profiles, and the things that make it feel like home.",
    to: "/settings",
    icon: Settings,
    layout: "compact",
  },
] as const;

function FloatingHearts() {
  const spots = [
    { left: "8%", top: "18%", delay: "0s", size: "text-lg" },
    { left: "88%", top: "12%", delay: "1.2s", size: "text-sm" },
    { left: "72%", top: "42%", delay: "0.6s", size: "text-base" },
    { left: "14%", top: "62%", delay: "2s", size: "text-xs" },
    { left: "92%", top: "78%", delay: "0.3s", size: "text-lg" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {spots.map((s, i) => (
        <Heart
          key={i}
          className={cn("float-heart absolute text-brand-rose/40", s.size)}
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
          fill="currentColor"
        />
      ))}
    </div>
  );
}

function EntryCta() {
  const { session, loading } = useAuth();
  const dest = session ? "/home" : "/login";
  const label = session ? "Enter our little world ♡" : "Open our little world ♡";

  return (
    <Link
      to={dest}
      className={cn("btn-romantic inline-flex items-center gap-2 text-sm sm:text-base", loading && "pointer-events-none opacity-70")}
    >
      {label}
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="landing-bg min-h-dvh w-full text-brand-ink">
      <section className="relative flex min-h-dvh w-full flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <FloatingHearts />
        <div className="relative z-10 mx-auto grid w-full max-w-[1600px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-in">
            <p className="font-accent text-xl text-brand-rose sm:text-2xl">A little something, made with love</p>
            <h1 className="font-serif mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-brand-burgundy sm:text-6xl lg:text-7xl">
              Hey, Darshu. <span className="text-brand-rose">♡</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-brown sm:text-xl">
              Someone has been collecting little things... and somehow, they all remind him of you.
            </p>
            <p className="font-display mt-4 text-2xl text-brand-taupe">Welcome to our little world.</p>
            <div className="mt-10">
              <EntryCta />
            </div>
          </div>
          <MadPolaroid
            src={MAD.hero}
            alt="Mallesh, Darshu, and our little companion"
            caption="home with you ♡"
            className="mx-auto max-w-xs rotate-1 shadow-xl lg:hidden"
          />
          <HeroVisual />
        </div>
      </section>

      <RevealSection className="border-t border-brand-blush/50 px-6 py-20 sm:px-12 lg:px-20">
        <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_220px] lg:items-start">
          <div>
          <h2 className="font-serif text-center text-3xl font-medium text-brand-burgundy sm:text-4xl lg:text-left">
            To my favourite person,
          </h2>
          <div className="letter-paper editorial-paper relative mt-10 rounded-sm p-8 sm:p-12">
            <span
              className="washi-tape pointer-events-none absolute -top-3 left-12 h-7 w-24 -rotate-2 rounded-sm opacity-90"
              aria-hidden
            />
            <span
              className="washi-tape pointer-events-none absolute -top-2 right-16 h-6 w-20 rotate-3 rounded-sm opacity-80"
              aria-hidden
            />
            <div className="whitespace-pre-line font-accent text-xl leading-relaxed text-brand-brown sm:text-2xl">
              {LETTER_BODY}
            </div>
          </div>
          </div>
          <MadPolaroid
            src={MAD.letterAccent}
            alt="A playful moment together"
            caption="little smiles"
            className="mx-auto mt-10 rotate-2 lg:mt-24 lg:mx-0"
          />
        </div>
      </RevealSection>

      <RevealSection className="bg-brand-cream/60 px-6 py-20 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[1600px]">
          <h2 className="font-serif max-w-2xl text-3xl font-medium text-brand-burgundy sm:text-4xl">
            Because the little things are never really little.
          </h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] lg:items-center">
            <MadPolaroid
              src={MAD.memoriesBand}
              alt="Us being silly together"
              caption="happiness"
              className="mx-auto max-w-[240px] -rotate-3"
            />
            <div className="grid gap-6 sm:grid-cols-2">
            {WHY_BLOCKS.map((block) => (
              <div
                key={block.title}
                className="editorial-paper rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
              >
                <p className="font-display text-2xl text-brand-burgundy">{block.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-brand-brown">{block.text}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="px-6 py-20 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[1600px]">
          <h2 className="font-serif text-3xl font-medium text-brand-burgundy sm:text-4xl">
            Every corner has a little story.
          </h2>
          <p className="mt-3 max-w-2xl text-brand-brown">Explore the places Mallesh built for you both.</p>
          <div className="mt-12 grid auto-rows-min gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const span =
                f.layout === "tall"
                  ? "md:row-span-2"
                  : f.layout === "wide"
                    ? "xl:col-span-2"
                    : f.layout === "letter"
                      ? "md:col-span-2 bg-brand-blush/25"
                      : "";
              return (
                <Link
                  key={f.title}
                  to={f.to}
                  className={cn(
                    "editorial-paper group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg",
                    span,
                    f.layout === "timeline" && "bg-gradient-to-br from-brand-cream to-brand-ivory",
                    f.layout === "jar" && "bg-gradient-to-t from-brand-blush/30 to-transparent",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-full bg-brand-blush/50 text-brand-burgundy">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <Sparkles className="size-4 text-brand-rose opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="font-display mt-4 text-xl text-brand-burgundy">{f.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-brown">{f.description}</p>
                  <span className="mt-4 text-xs font-medium uppercase tracking-wider text-brand-rose">
                    Peek inside →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-y border-brand-blush/40 bg-brand-cream/40 px-6 py-20 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="font-serif text-center text-3xl font-medium text-brand-burgundy">Nothing complicated. Just us.</h2>
          <div className="decorative-rule mx-auto mt-6 w-48" />
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              { step: "01", title: "Come inside", text: "Log in using your private account. This little world is only for the two of us." },
              { step: "02", title: "Leave little things", text: "Add memories, write letters, send brownies, save happiness notes and add things to our bucket list." },
              { step: "03", title: "Come back whenever", text: "Revisit our memories, discover surprises and keep adding new chapters to our story." },
            ].map((item) => (
              <li key={item.step} className="relative text-center">
                <p className="font-serif text-5xl font-light text-brand-blush">{item.step}</p>
                <h3 className="font-display mt-2 text-2xl text-brand-burgundy">{item.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-brand-brown">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </RevealSection>

      <RevealSection className="relative overflow-hidden px-6 py-20 sm:px-12 lg:px-20">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.12]"
          style={{ backgroundImage: `url(${MAD.promiseWide})` }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <MadPolaroid
            src={MAD.promiseWide}
            alt="A day out together"
            caption="our adventures"
            className="mx-auto mb-10 max-w-[260px] rotate-1 shadow-xl"
          />
          <h2 className="font-serif text-3xl font-medium text-brand-burgundy sm:text-4xl">
            Here&apos;s to all the little things we haven&apos;t experienced yet.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-brand-brown sm:text-lg">
            More memories to collect. More letters to write. More silly moments to laugh about. More places to explore.
            More reasons to smile.
            <br />
            <br />
            This little world may have a home on the internet, but its stories will always belong to us.
          </p>
        </div>
      </RevealSection>

      <section className="relative overflow-hidden border-t border-brand-blush/50 bg-brand-burgundy px-6 py-24 text-brand-ivory sm:px-12 lg:px-20">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">So, shall we make some more memories?</h2>
          <p className="mt-4 font-accent text-2xl text-brand-blush">Our little world is waiting for you, Darshu.</p>
          <div className="mt-10 flex justify-center">
            <EntryCta />
          </div>
        </div>
        <Heart className="pointer-events-none absolute -left-8 bottom-8 size-32 text-white/5" fill="currentColor" />
      </section>

      <footer className="px-6 py-8 text-center text-sm text-brand-taupe">
        Made with love, by Mallesh, for Darshu. ♡ · {APP_TITLE}
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative hidden min-h-[480px] animate-fade-in lg:block" style={{ animationDelay: "0.15s" }}>
      <MadPolaroid
        src={MAD.hero}
        alt="Mallesh, Darshu, and our little companion"
        caption="home with you ♡"
        className="absolute right-0 top-0 z-20 w-64 rotate-2 shadow-2xl"
      />
      <MadPolaroid
        src={MAD.polaroidA}
        alt="On the road together"
        caption="little rides"
        className="absolute left-0 top-12 z-10 w-48 -rotate-6"
      />
      <MadPolaroid
        src={MAD.polaroidB}
        alt="Us at home"
        className="absolute bottom-4 left-20 z-30 w-44 rotate-3"
      />
      <MadPolaroid
        src={MAD.polaroidC}
        alt="Silly horns and laughter"
        className="absolute bottom-20 right-8 z-10 w-40 -rotate-2 opacity-95"
      />
      <div className="editorial-paper absolute left-1/2 top-[42%] z-0 w-56 -translate-x-1/2 rounded-2xl p-6 opacity-90">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-taupe">A little world</p>
        <p className="font-display mt-2 text-2xl text-brand-burgundy">made of our little moments</p>
      </div>
    </div>
  );
}