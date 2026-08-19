'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { Settings } from './settings.types';

/*
 * The settings the server settled, handed to the client unchanged.
 *
 * There is nothing to compute here and nothing to refetch: the value is the
 * object the root layout read once for this request, so the provider is a
 * carrier rather than a source. A client component that wants to know whether
 * something is on asks this; it never reads an environment variable, and it
 * cannot reach the API's flags on its own.
 */
const SettingsContext = createContext<Settings | undefined>(undefined);

export const SettingsProvider = ({ children, settings }: { children: ReactNode; settings: Settings }) => (
  <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
);

/**
 * What is switched on for this request, in a client component.
 *
 * Throws outside the provider rather than handing back defaults: a screen
 * silently rendering as if every feature were off is far harder to notice than a
 * missing provider.
 */
export const useSettings = (): Settings => {
  const settings = useContext(SettingsContext);

  if (!settings) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return settings;
};
