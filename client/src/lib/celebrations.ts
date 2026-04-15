/**
 * Celebration Layer — confetti bursts, affirming messages, and a11y announcements
 * Uses canvas-confetti for particle effects
 * Messages are now provided by the caller (from i18n)
 */
import confetti from "canvas-confetti";

// ── Confetti presets ──
export function celebrateSuccess() {
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
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

// ── Combined celebrate + announce (message passed in from i18n) ──
export function celebrate(message: string, intensity: "subtle" | "normal" | "milestone" = "normal") {
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
