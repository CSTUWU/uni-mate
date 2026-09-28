import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * useState synced with localStorage - value is read once from the given key
 * (falling back to `initial`) and written back on every change.
 */
export function usePersistedState<T>(
  key: string,
  initial: () => T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      /* corrupt value - fall through to initial */
    }
    return initial();
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable - ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
