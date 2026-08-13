import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Cta } from './cta';

const meta = {
  title: 'Sections/Reverse Lookup/Cta',
  component: Cta,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The closing call to action. The panel is `bg-brand-solid-section` (primary-800), sampled from the ' +
          'frame rather than inferred. The dotted world map behind the copy is not implemented — it is a ' +
          'decorative layer inside the CTA symbol and needs its own export, so the panel renders flat until then.',
      },
    },
  },
  argTypes: {
    defaultCountry: { control: 'text', description: 'Country the phone field starts on' },
  },
  args: { defaultCountry: 'GB' },
} satisfies Meta<typeof Cta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};
