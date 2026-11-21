'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useErrorText } from './use-error-text';

/**
 * Runs a mutation, tracks which action is pending, translates errors, and refreshes the
 * server-rendered page on success so it shows the new state from the API.
 */
export function useAction() {
  const router = useRouter();
  const errorText = useErrorText();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      key: string,
      fn: () => Promise<unknown>,
      opts: { refresh?: boolean } = {},
    ): Promise<boolean> => {
      setPending(key);
      setError(null);
      try {
        await fn();
        if (opts.refresh !== false) router.refresh();
        return true;
      } catch (err) {
        setError(errorText.message(err));
        return false;
      } finally {
        setPending(null);
      }
    },
    [router, errorText],
  );

  return { run, pending, error, setError };
}
