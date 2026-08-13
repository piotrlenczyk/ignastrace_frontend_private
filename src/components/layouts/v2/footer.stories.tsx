import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FooterV2 } from '@/components/layouts/v2/footer';

const meta = {
  title: 'Components/FooterV2',
  component: FooterV2,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The new-design footer — four link columns, not the legacy footer’s grouping, which is why it is a new ' +
          'component rather than a restyle. The disclaimer shows only the sentence the frame shows; its “read ' +
          'more” affordance links to Terms.',
      },
    },
  },
} satisfies Meta<typeof FooterV2>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};
