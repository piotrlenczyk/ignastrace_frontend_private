import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FullReport } from './full-report';

const meta = {
  title: 'Sections/Reverse Lookup/FullReport',
  component: FullReport,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The six-cell feature grid. The rules belong to the grid rather than to the cells — a right and bottom ' +
          'border per cell plus a top and left edge on the container — so they stay 1px where two cells meet. ' +
          'The glyphs are the design’s own trimmed SVGs, rendered at natural size inside a 24px box.',
      },
    },
  },
} satisfies Meta<typeof FullReport>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

/* One column below `sm`, two up to `lg`, three above. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};
