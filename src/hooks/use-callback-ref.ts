import { type MutableRefObject, useEffect, useRef } from 'react';

export const useCallbackRef = <T>(callback: T): MutableRefObject<T> => {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return callbackRef;
};
