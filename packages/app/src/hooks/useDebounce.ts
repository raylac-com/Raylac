import { useState, useEffect } from 'react';

/**
 * Debounce a value.
 * Used to throttle the number of times a function is called as the user types in an input field.
 */
const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setIsPending(false);
      setDebouncedValue(value);
    }, delay);

    return () => {
      setIsPending(true);
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isPending };
};

export default useDebounce;
