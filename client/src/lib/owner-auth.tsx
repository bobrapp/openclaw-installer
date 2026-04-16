/**
 * Owner Auth Context — persists passphrase across SPA navigations.
 * Auto-clears after 30 minutes of inactivity.
 * No localStorage (sandboxed iframe) — memory-only.
 */
import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";

interface OwnerAuthContextType {
  passphrase: string | null;
  setPassphrase: (p: string) => void;
  clearPassphrase: () => void;
  isAuthenticated: boolean;
}

const OwnerAuthContext = createContext<OwnerAuthContextType>({
  passphrase: null,
  setPassphrase: () => {},
  clearPassphrase: () => {},
  isAuthenticated: false,
});

const SESSION_TIMEOUT_MS = 30 * 60_000; // 30 minutes

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const [passphrase, setPassphraseState] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const clearPassphrase = useCallback(() => {
    setPassphraseState(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const setPassphrase = useCallback((p: string) => {
    setPassphraseState(p);
    // Reset the inactivity timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPassphraseState(null);
    }, SESSION_TIMEOUT_MS);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <OwnerAuthContext.Provider value={{
      passphrase,
      setPassphrase,
      clearPassphrase,
      isAuthenticated: passphrase !== null,
    }}>
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  return useContext(OwnerAuthContext);
}
