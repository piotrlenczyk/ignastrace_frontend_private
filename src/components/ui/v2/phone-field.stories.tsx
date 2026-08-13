import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import type * as RPNInput from 'react-phone-number-input';

import type { PhoneInputProps } from '@/components/ui/phone-input/types';
import { PhoneFieldV2 } from '@/components/ui/v2/phone-field';

/*
 * The field is uncontrolled from Storybook's point of view but controlled from
 * react-phone-number-input's — it needs a value/onChange pair to reformat as you
 * type, so the state lives in this wrapper rather than in an arg.
 */
const StatefulPhoneField = ({ value: initial, ...props }: PhoneInputProps) => {
  const [value, setValue] = React.useState<RPNInput.Value | undefined>(initial);

  return <PhoneFieldV2 {...props} value={value} onChange={setValue} />;
};

/*
 * The surrounding surface — border, radius, shadow — belongs to the form the
 * field sits in, not to the field, so the design's CTA container is reproduced
 * here to show the component at its intended size.
 */
const FieldSurface = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[420px] max-w-full rounded-lg border border-border-primary bg-bg-primary p-2 shadow-uui-xs">
    {children}
  </div>
);

const meta = {
  title: 'Components/PhoneFieldV2',
  component: StatefulPhoneField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The new-design phone field: a restyle of `components/ui/phone-input`, with the country list, calling ' +
          'codes, per-country placeholders and locale labels still driven by react-phone-number-input. The country ' +
          'dropdown has no Figma frame — its surface is styled from the new tokens by analogy with the language menu.',
      },
    },
  },
  argTypes: {
    defaultCountry: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: { defaultCountry: 'GB' },
  decorators: [
    (Story) => (
      <FieldSurface>
        <Story />
      </FieldSurface>
    ),
  ],
} satisfies Meta<typeof StatefulPhoneField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/* A different default country changes both the flag and the placeholder format. */
export const UnitedStates: Story = {
  args: { defaultCountry: 'US' },
};

export const WithValue: Story = {
  args: { defaultCountry: 'PL', value: '+48601123456' as RPNInput.Value },
};

/* Disabled hides the chevron: the country is fixed, so the trigger is not a menu. */
export const Disabled: Story = {
  args: { disabled: true, value: '+447700900123' as RPNInput.Value },
};
