/**
 * Ambient Background — generative SVG morphing + dark mode particles
 * Navy/teal palette. Gentle, non-distracting. Responds to mouse in dark mode.
 */
import { useEffect, useRef, useCallback } from "react";

// ── Morphing SVG blob background (light & dark) ──
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Warm gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Animated morphing blobs */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="ambient-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>
          <linearGradient id="blob-grad-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(183, 98%, 22%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(215, 50%, 25%)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="blob-grad-2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(188, 35%, 47%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(183, 98%, 22%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <g filter="url(#ambient-blur)">
          <ellipse cx="300" cy="350" rx="300" ry="250" fill="url(#blob-grad-1)">
            <animate
              attributeName="cx"
              values="300;400;250;300"
              dur="20s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="350;250;400;350"
              dur="25s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="rx"
              values="300;350;280;300"
              dur="18s"
              repeatCount="indefinite"
            />
          </ellipse>

          <ellipse cx="800" cy="400" rx="280" ry="220" fill="url(#blob-grad-2)">
            <animate
              attributeName="cx"
              values="800;700;850;800"
              dur="22s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="400;500;300;400"
              dur="19s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="ry"
              values="220;280;200;220"
              dur="23s"
              repeatCount="indefinite"
            />
          </ellipse>

          <circle cx="600" cy="200" r="150" fill="hsl(183, 98%, 22%)" fillOpacity="0.12">
            <animate
              attributeName="r"
              values="150;200;130;150"
              dur="15s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cx"
              values="600;650;550;600"
              dur="21s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>

      {/* Dark mode particle canvas */}
      <DarkModeParticles />
    </div>
  );
}

// ── Dark mode particle system (mouse-responsive) ──
function DarkModeParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  const handleMouse = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Only run particles when dark mode is active
    if (!document.documentElement.classList.contains("dark")) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let running = true;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }[] = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.5 ? 183 : 215,
      });
    }

    const animate = () => {
      if (!running || document.hidden) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p) => {
        // Gentle mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.02;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Dampen
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Breathe alpha
        p.alpha += (Math.random() - 0.5) * 0.01;
        p.alpha = Math.max(0.05, Math.min(0.5, p.alpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 60%, ${p.alpha})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    // Debounced resize handler (150ms)
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }, 150);
    };

    // Pause on visibility change
    const onVisibilityChange = () => {
      // animate() already checks document.hidden — no extra action needed
    };

    // MutationObserver to detect theme toggle (class changes on <html>)
    const observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains("dark")) {
        running = false;
        cancelAnimationFrame(animRef.current);
        ctx.clearRect(0, 0, w, h);
      } else if (!running) {
        running = true;
        animate();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
    };
  }, [handleMouse]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full hidden dark:block"
      style={{ opacity: 0.6 }}
    />
  );
}
