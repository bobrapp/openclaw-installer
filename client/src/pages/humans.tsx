/**
 * /humans — Easter egg thank-you page
 * Inspired by humans.txt, but more heartfelt.
 */
import { useEffect, useState } from "react";
import { Heart, Sparkles, Globe, Coffee, Star } from "lucide-react";
import { celebrateMilestone } from "@/lib/celebrations";
import { playSound } from "@/lib/sound-engine";

const gratitudes = [
  "To every open-source contributor who ever pushed a commit at 2 AM",
  "To the teachers who made us believe we could build things",
  "To the communities that said \"you belong here\" when we weren't sure",
  "To everyone who filed a bug report instead of just complaining",
  "To the people who write documentation — you are the real heroes",
  "To anyone who ever answered a question on Stack Overflow with patience",
  "To the accessibility advocates making the web work for everyone",
  "To the dreamers who think technology should make humans more human",
];

export default function Humans() {
  const [visibleItems, setVisibleItems] = useState(0);
  const [showGratitudes, setShowGratitudes] = useState(false);

  useEffect(() => {
    celebrateMilestone();
    playSound("success");

    // Stagger reveal
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          setTimeout(() => setShowGratitudes(true), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10 py-12">
      {/* Header */}
      <div
        className={`text-center space-y-4 transition-all duration-700 ${
          visibleItems >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight">You found the humans.</h1>
          <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Behind every line of code, there's a person who cared enough to write it.
        </p>
      </div>

      {/* Founders */}
      <div
        className={`transition-all duration-700 delay-300 ${
          visibleItems >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Made with love by
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Bob Rapp</p>
              <p className="text-xs text-muted-foreground">Co-founder, AiGovOps Foundation</p>
              <p className="text-xs text-muted-foreground/70">
                Believes every human deserves technology that respects them
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Ken Johnston</p>
              <p className="text-xs text-muted-foreground">Co-founder, AiGovOps Foundation</p>
              <p className="text-xs text-muted-foreground/70">
                Working to make governance-as-code accessible to everyone
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech credits */}
      <div
        className={`transition-all duration-700 delay-500 ${
          visibleItems >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            Built with
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "React", "TypeScript", "Tailwind CSS", "Express", "SQLite",
              "shadcn/ui", "Vite", "Drizzle ORM", "Recharts",
              "canvas-confetti", "Web Audio API", "Love",
            ].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div
        className={`transition-all duration-700 delay-700 ${
          visibleItems >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Our mission
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The AiGovOps Foundation works to make AI governance accessible, transparent, and human-centered.
            We believe in governance-as-code, human-in-the-loop decision making, and empowering
            disadvantaged communities through open-source tools.
          </p>
          <a
            href="https://www.aigovopsfoundation.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Learn more at aigovopsfoundation.org
            <Sparkles className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Gratitude wall */}
      {showGratitudes && (
        <div className="space-y-3 transition-all duration-700">
          <h2 className="text-sm font-semibold text-center flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Gratitude wall
          </h2>
          <div className="space-y-2">
            {gratitudes.map((g, i) => (
              <p
                key={i}
                className="text-xs text-muted-foreground text-center italic opacity-0 animate-[fadeInUp_0.5s_ease_forwards]"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {g}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sign-off */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground/50">
          If you're reading this, you're one of us. Welcome home.
        </p>
      </div>
    </div>
  );
}
