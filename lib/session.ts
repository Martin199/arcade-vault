import { useCallback, useMemo, useSyncExternalStore } from "react";

export interface User {
  name: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
// "storage" solo se dispara en otras pestañas; este evento avisa a la pestaña actual.
const CHANGE_EVENT = "av-session-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// El snapshot es el string crudo: es estable entre lecturas, así que no provoca re-renders infinitos.
function getSnapshot(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

// En el servidor siempre se renderiza como invitado.
function getServerSnapshot(): string | null {
  return null;
}

function writeUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSession(): {
  user: User | null;
  signIn: (user: User | null) => void;
  signOut: () => void;
} {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo<User | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }, [raw]);

  const signIn = useCallback((u: User | null) => writeUser(u), []);
  const signOut = useCallback(() => writeUser(null), []);

  return { user, signIn, signOut };
}

export function saveScore(entry: Omit<SavedScore, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]") as SavedScore[];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
