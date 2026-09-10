import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import type * as RPNInput from 'react-phone-number-input';

import { PhoneCtaFormV2, type PhoneCtaFormV2Props } from '@/components/ui/v2/phone-cta-form';

/*
 * The form is uncontrolled from Storybook's point of view but controlled from
 * react-phone-number-input's — it needs a value/onChange pair to reformat as you
 * type, so the state lives in this wrapper rather than in an arg.
 */
const StatefulPhoneCtaForm = ({ value: initial, ...props }: PhoneCtaFormV2Props) => {
  const [value, setValue] = React.useState<RPNInput.Value | undefined>(initial);

  return <PhoneCtaFormV2 {...props} value={value} onChange={setValue} />;
};

/*
 * `Type=Desktop` is the `lg:` breakpoint, so these stories pin a width rather
 * than take a prop: 559px is the desktop frame, 361px the mobile one. The `lg:`
 * classes key off the viewport, not the container, so use Storybook's viewport
 * toolbar to see the mobile layout — the narrow frame below only shows the
 * component reflowing, not the mobile spacing.
 */
const Frame = ({ width, children }: { width: number; children: React.ReactNode }) => (
  <div style={{ width }} className="max-w-full">
    {children}
  </div>
);

const meta = {
  title: 'Components/PhoneCtaFormV2',
  component: StatefulPhoneCtaForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The new-design phone CTA form, built from `CTA From` (10047:17508). `product` is the set’s Product ' +
          'property; its Type property is the `lg:` breakpoint rather than a prop, and on mobile the submit button ' +
          'is not inside the field at all. The set’s Focus variant is identical to Default apart from the input ' +
          'holding a value, so no ring is implemented on the field. The country dropdown has no Figma frame — its ' +
          'surface is styled by analogy with the language menu.',
      },
    },
  },
  argTypes: {
    product: { control: 'inline-radio', options: ['lookup', 'locate'] },
    defaultCountry: { control: 'text' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: { defaultCountry: 'GB', submitLabel: 'Lookup' },
  decorators: [
    (Story) => (
      <Frame width={559}>
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof StatefulPhoneCtaForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/* `Product=Locate` swaps the button's glyph and label; nothing else changes. */
export const Locate: Story = {
  args: { product: 'locate', submitLabel: 'Locate' },
};

/* The set's `Focus` state — visually just Default with a value in the input. */
export const WithValue: Story = {
  args: { value: '+447700900123' as RPNInput.Value },
};

/*
 * `Error`: the field turns red, its country divider with it, and the message
 * stacks underneath. Figma drops the `+44` label in this state; it is kept here,
 * because hiding the calling code the field is actually using would be a
 * functional regression rather than a restyle.
 */
export const Error: Story = {
  args: { value: '+44635154328' as RPNInput.Value, error: 'Please enter valid number' },
};

/* The visual state without a message, for a form that reports errors elsewhere. */
export const InvalidWithoutMessage: Story = {
  args: { value: '+44635154328' as RPNInput.Value, invalid: true },
};

/* Loading forwards to the button, which disables itself and shows its spinner. */
export const Submitting: Story = {
  args: { value: '+447700900123' as RPNInput.Value, loading: true, submitLabel: 'Lookup' },
};

/*
 * The mobile frame: no submit button inside the field, and the usage badge, which
 * the set draws on mobile only. Pair with Storybook's mobile viewport to see the
 * mobile paddings and the 20px flag — `lg:` keys off the viewport, not this width.
 */
export const Mobile: Story = {
  args: { submitLabel: undefined, badge: '1 / 5 today' },
  decorators: [
    (Story) => (
      <Frame width={361}>
        <Story />
      </Frame>
    ),
  ],
};

/* Disabled hides the chevron: the country is fixed, so the trigger is not a menu. */
export const Disabled: Story = {
  args: { disabled: true, value: '+447700900123' as RPNInput.Value },
};
