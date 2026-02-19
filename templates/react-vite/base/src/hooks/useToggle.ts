import { useState, useCallback } from "react";

/**
 * Simple toggle hook.
 * Example: const [isOpen, toggle] = useToggle(false);
 */
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}
