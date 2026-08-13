import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';

import { MobileMenuV2 } from '@/components/navigation/v2/mobile-menu';

/*
 * `open` is owned by the navbar in the app, so the stories own it here. Keeping
 * it as component state rather than an arg means the trigger actually toggles.
 */
const StatefulMobileMenu = ({ open: initial = false }: { open?: boolean }) => {
  const [open, setOpen] = React.useState(initial);

  return <MobileMenuV2 open={open} onOpenChange={setOpen} />;
};

const meta = {
  title: 'Components/MobileMenuV2',
  component: StatefulMobileMenu,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The `lg:hidden` menu — nothing renders above that breakpoint, so these stories are pinned to a phone ' +
          'viewport. The panel opens below the header rather than over it, and is deliberately non-modal so the ' +
          'language selector in the header stays usable while it is open.',
      },
    },
  },
  globals: { viewport: { value: 'mobile2' } },
} satisfies Meta<typeof StatefulMobileMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { open: true },
};
