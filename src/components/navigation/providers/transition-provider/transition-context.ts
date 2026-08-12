import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';

type Animation = 'animate-fade-in' | 'animate-fade-out' | 'hidden';

type TransitionContextType = {
  className: string;
  setClassName: Dispatch<SetStateAction<Animation>>;
};

const TransitionContext = createContext<TransitionContextType | null>(null);

export { type Animation, TransitionContext, type TransitionContextType };
