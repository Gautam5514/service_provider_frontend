"use client";

import { useEffect, useState } from "react";

// Returns `value`, but only updates after it's stopped changing for `delayMs`.
// Used to avoid firing a server request on every keystroke in a search box.
export function useDebouncedValue(value, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
