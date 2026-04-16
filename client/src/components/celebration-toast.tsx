/**
 * CelebrationToast — animated affirming message shown after milestones
 * Fades in, stays briefly, fades out. Non-blocking.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles } from "lucide-react";

interface CelebrationToastProps {
  message: string;
  visible: boolean;
  onDone: () => void;
}

export function CelebrationToast({ message, visible, onDone }: CelebrationToastProps) {
  const [show, setShow] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!visible) return;
    setShow(true);
    let innerTimer: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setShow(false);
      innerTimer = setTimeout(() => onDoneRef.current(), 500);
    }, 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(innerTimer);
    };
  }, [visible]);

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
