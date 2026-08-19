import { getServerSettings } from '@/settings/settings.server';

import packageJson from '../../../package.json';
import { TestWidgetClient } from './test-widget-client';

/**
 * The QA widget: what is switched on for this request, and the cookies that
 * change it.
 *
 * Rendered from the root layout and gated on `testWidgetEnabled`, which is an
 * environment-only setting — no cookie can summon it, because the panel reads
 * this application's configuration back to whoever opens it.
 *
 * The settings it displays are the settled ones, so a tester sees the answer the
 * application is actually acting on rather than the inputs it was derived from.
 *
 * It is written on the new tokens and kept under the redesign ratchet, but it gets
 * no story: the workbench catalogues the design system, and this is tooling that
 * happens to be built out of it.
 */
export const TestWidget = async () => {
  const settings = await getServerSettings();

  if (!settings.testWidgetEnabled) {
    return null;
  }

  return <TestWidgetClient settings={settings} version={packageJson.version} />;
};
