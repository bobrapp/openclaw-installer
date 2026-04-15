/**
 * Celebration Layer — confetti bursts, affirming messages, and a11y announcements
 * Uses canvas-confetti for particle effects, Web Audio API for optional chimes
 */
import confetti from "canvas-confetti";

// ── Affirming messages for milestones ──
const affirmations: Record<string, string[]> = {
  preflight: [
    "Preflight complete — your system is ready.",
    "All checks passed. You're set up for success.",
    "Environment verified. Safe to proceed.",
  ],
  install: [
    "Installation complete. You just made it safer.",
    "Deployed with care. Well done.",
    "Another step toward a more human-friendly world.",
  ],
  hardening: [
    "Hardened. Your infrastructure thanks you.",
    "Security first — you're doing it right.",
    "Locked down and ready for production.",
  ],
  general: [
    "Nice work. Every step matters.",
    "Progress feels good, doesn't it?",
    "You're building something meaningful.",
    "One more thing made better today.",
    "Humans and AI, working together.",
  ],
};

export function getAffirmation(category: string = "general"): string {
  const pool = affirmations[category] || affirmations.general;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Confetti presets ──
export function celebrateSuccess() {
  // Burst from both sides
  const defaults = {
    spread: 60,
    ticks: 80,
    gravity: 1.2,
    decay: 0.94,
    startVelocity: 30,
    colors: ["#01696F", "#1B3A6B", "#10b981", "#f59e0b", "#6366f1"],
  };

  confetti({ ...defaults, particleCount: 40, origin: { x: 0.2, y: 0.7 }, angle: 60 });
  confetti({ ...defaults, particleCount: 40, origin: { x: 0.8, y: 0.7 }, angle: 120 });
}

export function celebrateMilestone() {
  // Bigger celebration — stars and circles
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#01696F", "#1B3A6B", "#10b981"],
      shapes: ["circle"],
      scalar: 1.2,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#f59e0b", "#6366f1", "#ec4899"],
      shapes: ["star"],
      scalar: 1.2,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export function celebrateSubtle() {
  // Single soft burst — for smaller wins
  confetti({
    particleCount: 25,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#01696F", "#1B3A6B"],
    ticks: 60,
    gravity: 1.5,
    scalar: 0.8,
  });
}

// ── A11y announcements ──
let announcer: HTMLDivElement | null = null;

function getAnnouncer(): HTMLDivElement {
  if (announcer) return announcer;
  announcer = document.createElement("div");
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  announcer.style.cssText =
    "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;";
  document.body.appendChild(announcer);
  return announcer;
}

export function announceToScreenReader(message: string) {
  const el = getAnnouncer();
  el.textContent = "";
  // Small delay to ensure the change is detected
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

// ── Combined celebrate + announce ──
export function celebrate(category: string = "general", intensity: "subtle" | "normal" | "milestone" = "normal") {
  const message = getAffirmation(category);

  switch (intensity) {
    case "subtle":
      celebrateSubtle();
      break;
    case "milestone":
      celebrateMilestone();
      break;
    default:
      celebrateSuccess();
  }

  announceToScreenReader(message);
  return message;
}
