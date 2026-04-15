/**
 * CelebrationToast — animated affirming message shown after milestones
 * Fades in, stays briefly, fades out. Non-blocking.
 */
import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";

interface CelebrationToastProps {
  message: string;
  visible: boolean;
  onDone: () => void;
}

export function CelebrationToast({ message, visible, onDone }: CelebrationToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDone, 500); // Wait for fade-out
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDone]);

  if (!visible && !show) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Hook to trigger celebrations
export function useCelebration() {
  const [toast, setToast] = useState({ message: "", visible: false });

  const celebrate = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const dismiss = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, celebrate, dismiss };
}
