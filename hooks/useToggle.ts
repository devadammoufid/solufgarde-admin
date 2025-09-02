


// hooks/useToggle.ts - Toggle Hook
'use client';

import { useState, useCallback } from 'react';

export function useToggle(
  initialValue = false
): [boolean, () => void, (value?: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setToggle = useCallback((newValue?: boolean) => {
    if (typeof newValue === 'boolean') {
      setValue(newValue);
    } else {
      setValue(v => !v);
    }
  }, []);

  return [value, toggle, setToggle];
}
