'use client';

import { useCallback } from 'react';

type UseOtpInputProps = {
  length?: number;
  onComplete?: (otp: string) => void;
};

export function useOtpInput({ length = 6, onComplete }: UseOtpInputProps = {}) {
  const handleComplete = useCallback(
    (otp: string) => {
      onComplete?.(otp);
    },
    [onComplete],
  );

  return { length, handleComplete };
}
