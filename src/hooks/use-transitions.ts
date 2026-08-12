'use client';

import { useContext } from 'react';

import {
  type Animation,
  TransitionContext,
} from '@/components/navigation/providers/transition-provider/transition-context';

const ANIMATION_DURATION_MS = 200;

export function useTransitions() {
  const transitionContext = useContext(TransitionContext);

  if (!transitionContext) {
    throw new Error(
      'You are attempting to use useTransitions outside of a TransitionContext.',
    );
  }

  const context = transitionContext;

  function fadeOut() {
    return animate('animate-fade-out', context);
  }

  function fadeIn() {
    return animate('animate-fade-in', context);
  }

  function hide() {
    return context.setClassName('hidden');
  }

  return { fadeOut, fadeIn, hide };
}

function animate(animation: Animation, context: any) {
  return new Promise((resolve) => {
    context.setClassName(animation);

    setTimeout(resolve, ANIMATION_DURATION_MS);
  });
}
