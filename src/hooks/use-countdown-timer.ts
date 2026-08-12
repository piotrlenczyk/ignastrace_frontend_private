'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseCountdownTimerOptions = {
  initialMinutes: number;
  storageKey: string;
  onComplete?: () => void;
};

export const useCountdownTimer = ({
  initialMinutes,
  storageKey,
  onComplete,
}: UseCountdownTimerOptions) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const savedEndTime = localStorage.getItem(storageKey);
    const completedKey = `${storageKey}-completed`;
    const isCompleted = localStorage.getItem(completedKey) === 'true';

    if (isCompleted) {
      setTimeLeft(0);
      setIsActive(false);
      setIsLoaded(true);
      onComplete?.();
      return;
    }

    if (savedEndTime) {
      const endTime = Number.parseInt(savedEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsActive(true);
        lastUpdateRef.current = now;
      } else {
        setTimeLeft(0);
        setIsActive(false);
        localStorage.setItem(completedKey, 'true');
        onComplete?.();
      }
    } else {
      const endTime = Date.now() + (initialMinutes * 60 * 1000);
      localStorage.setItem(storageKey, endTime.toString());
      setTimeLeft(initialMinutes * 60);
      setIsActive(true);
      lastUpdateRef.current = Date.now();
      // fix time real
      setTimeout(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(remaining);
      }, 0);
    }

    setIsLoaded(true);
  }, [isClient, initialMinutes, storageKey, onComplete]);

  const updateTimer = useCallback(() => {
    const now = Date.now();
    const savedEndTime = localStorage.getItem(storageKey);

    if (!savedEndTime) {
      return;
    }

    const endTime = Number.parseInt(savedEndTime, 10);
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    setTimeLeft(remaining);
    lastUpdateRef.current = now;

    if (remaining <= 0) {
      setIsActive(false);
      const completedKey = `${storageKey}-completed`;
      localStorage.setItem(completedKey, 'true');
      onComplete?.();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [storageKey, onComplete]);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, isActive, updateTimer]);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        updateTimer();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isClient, isActive, timeLeft, updateTimer]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback(() => {
    if (!isClient) {
      return;
    }

    const completedKey = `${storageKey}-completed`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(completedKey);

    const endTime = Date.now() + (initialMinutes * 60 * 1000);
    localStorage.setItem(storageKey, endTime.toString());
    setTimeLeft(initialMinutes * 60);
    setIsActive(true);
    setIsLoaded(true);
    lastUpdateRef.current = Date.now();
  }, [isClient, storageKey, initialMinutes]);

  const clearTimer = useCallback(() => {
    if (!isClient) {
      return;
    }

    const completedKey = `${storageKey}-completed`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(completedKey);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTimeLeft(0);
    setIsActive(false);
    setIsLoaded(false);
  }, [isClient, storageKey]);

  return {
    timeLeft,
    isActive,
    isLoaded,
    formattedTime: formatTime(timeLeft),
    resetTimer,
    clearTimer,
  };
};
