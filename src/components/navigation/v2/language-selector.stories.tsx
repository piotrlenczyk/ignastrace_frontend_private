import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LanguageSelectorV2 } from '@/components/navigation/v2/language-selector';

const meta = {
  title: 'Components/LanguageSelectorV2',
  component: LanguageSelectorV2,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'One action, two surfaces: a dropdown on desktop and a bottom sheet below `lg`, each with its own ' +
          'trigger, because the design gives the mobile case a sheet and leaves the desktop case to the legacy ' +
          'dropdown. Switching a locale pushes the route and refreshes; signed-in users also persist the choice.',
      },
    },
  },
} satisfies Meta<typeof LanguageSelectorV2>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Radix dropdown, anchored to the trigger. */
export const Desktop: Story = {};

/* The same trigger below `lg`, opening a bottom sheet instead. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};
