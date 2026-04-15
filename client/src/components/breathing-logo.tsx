/**
 * Breathing Logo — animated SVG with gentle glow pulse
 * Used in the sidebar header. The OpenClaw diamond-stack logo.
 */
export function BreathingLogo({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`breathing-logo ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-primary"
        aria-label="OpenClaw logo"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

// CSS for the breathing glow — add to index.css:
// .breathing-logo { animation: breathe 4s ease-in-out infinite; }
// @keyframes breathe { 0%,100% { filter: drop-shadow(0 0 2px hsl(183 98% 22% / 0.3)); } 50% { filter: drop-shadow(0 0 8px hsl(183 98% 22% / 0.6)); } }
