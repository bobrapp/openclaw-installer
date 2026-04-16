/**
 * useCopyToClipboard — reusable hook for clipboard copy with fallback
 * Handles clipboard API, Blob download fallback (sandboxed iframe),
 * 2-second "copied" state, and optional sound effect.
 */
import { useState, useCallback } from "react";

interface UseCopyOptions {
  /** Filename for download fallback (without extension) */
  fallbackFilename?: string;
  /** Duration in ms to show "copied" state (default 2000) */
  resetMs?: number;
  /** Play sound on copy (default true) */
  sound?: boolean;
}

export function useCopyToClipboard(options: UseCopyOptions = {}) {
  const { fallbackFilename = "config", resetMs = 2000, sound = true } = options;
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string, filename?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {
        // Fallback: download as file (clipboard blocked in sandboxed iframe)
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename || fallbackFilename}.yaml`;
        a.click();
        URL.revokeObjectURL(url);
        setCopied(true);
      }

      if (sound) {
        // Lazy-import sound engine to avoid eager AudioContext creation
        import("@/lib/sound-engine").then((m) => m.playSound("click")).catch(() => {});
      }

      setTimeout(() => setCopied(false), resetMs);
    },
    [fallbackFilename, resetMs, sound],
  );

  return { copy, copied };
}
