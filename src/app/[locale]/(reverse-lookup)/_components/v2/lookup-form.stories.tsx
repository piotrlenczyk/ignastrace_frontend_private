import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LookupForm } from './lookup-form';

const meta = {
  title: 'Sections/Reverse Lookup/LookupForm',
  component: LookupForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The phone field and its submit button — the same form in the hero and in the CTA, so the submit path ' +
          'stays in one place. Submitting an invalid number shows the schema’s message; a valid one would save ' +
          'the number and route on, and the server action behind that is stubbed in Storybook (see ' +
          '`.storybook/mocks`). The button sits inside the bordered row on desktop and drops below the field ' +
          'on mobile.',
      },
    },
  },
  argTypes: {
    defaultCountry: { control: 'text', description: 'Country the phone field starts on' },
    destinationUrl: { control: 'text', description: 'Route pushed after a successful submit' },
  },
  args: { defaultCountry: 'GB' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[640px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LookupForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

/* The button reflows to a full-width block under the field. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};

/* Submit an empty field on this story to see the error state. */
export const UnitedStates: Story = {
  args: { defaultCountry: 'US' },
};
