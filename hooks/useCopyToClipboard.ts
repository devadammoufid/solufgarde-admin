

// hooks/useCopyToClipboard.ts - Copy to Clipboard Hook
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

type CopyResult = {
  success: boolean;
  error?: Error;
};

export function useCopyToClipboard(
  successMessage = 'Copied to clipboard!',
  errorMessage = 'Failed to copy to clipboard'
): [boolean, (text: string) => Promise<CopyResult>] {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string): Promise<CopyResult> => {
      if (!navigator?.clipboard) {
        const result: CopyResult = {
          success: false,
          error: new Error('Clipboard not supported'),
        };
        toast.error(errorMessage);
        return result;
      }

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success(successMessage);
        return { success: true };
      } catch (error) {
        const result: CopyResult = {
          success: false,
          error: error as Error,
        };
        toast.error(errorMessage);
        return result;
      }
    },
    [successMessage, errorMessage]
  );

  return [isCopied, copyToClipboard];
}