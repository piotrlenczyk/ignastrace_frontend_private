import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Hero } from './hero';

const meta = {
  title: 'Sections/Reverse Lookup/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Hero of the rebuilt reverse-lookup landing page. The right-hand visual is a single exported PNG rather ' +
          'than markup — it is a ~40-node composition in Figma — and its phone screen has English copy baked in, ' +
          'so a localised hero needs a per-locale export. The rating row is desktop-only by design.',
      },
    },
  },
  argTypes: {
    defaultCountry: { control: 'text', description: 'Country the phone field starts on' },
  },
  args: { defaultCountry: 'GB' },
} satisfies Meta<typeof Hero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};
