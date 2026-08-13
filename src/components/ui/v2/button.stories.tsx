import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from '@/components/ui/icon';
import { ButtonV2 } from '@/components/ui/v2/button';

const HIERARCHIES = [
  'primary',
  'secondary-gray',
  'secondary-color',
  'tertiary-gray',
  'link-gray',
  'link-color',
] as const;

const SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

const meta = {
  title: 'Components/ButtonV2',
  component: ButtonV2,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The new-design button. `hierarchy` and `size` carry Untitled UI’s property names, so the prop pair and ' +
          'the Figma component set name the same thing. `destructive` is a modifier rather than a hierarchy of its ' +
          'own and composes with all six.',
      },
    },
  },
  argTypes: {
    hierarchy: { control: 'select', options: HIERARCHIES },
    size: { control: 'select', options: SIZES },
    destructive: { control: 'boolean' },
    disabled: { control: 'boolean' },
    asChild: { table: { disable: true } },
  },
  args: { children: 'Lookup' },
} satisfies Meta<typeof ButtonV2>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/*
 * The full grid. The link hierarchies carry no padding by design — they are
 * typographic, so their rows read as text at each size rather than as buttons.
 */
export const Hierarchies: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <table className="border-separate border-spacing-4">
      <thead>
        <tr>
          <th />
          {SIZES.map((size) => (
            <th key={size} className="font-body text-xs-medium text-text-tertiary">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {HIERARCHIES.map((hierarchy) => (
          <tr key={hierarchy}>
            <th className="text-left font-body text-xs-medium whitespace-nowrap text-text-tertiary">{hierarchy}</th>
            {SIZES.map((size) => (
              <td key={size}>
                <ButtonV2 {...args} hierarchy={hierarchy} size={size} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/* Every hierarchy in its destructive form. */
export const Destructive: Story = {
  args: { destructive: true, children: 'Delete account' },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {HIERARCHIES.map((hierarchy) => (
        <ButtonV2 key={hierarchy} {...args} hierarchy={hierarchy} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {HIERARCHIES.map((hierarchy) => (
        <ButtonV2 key={hierarchy} {...args} hierarchy={hierarchy} />
      ))}
    </div>
  ),
};

/*
 * Icons are children, not a prop: the base class list already handles their
 * shrink and pointer behaviour, and the size variant sets the gap.
 */
export const WithIcon: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonV2 {...args}>
        <Icon name="search" className="size-5" />
        Lookup
      </ButtonV2>
      <ButtonV2 {...args} hierarchy="secondary-gray">
        Continue
        <Icon name="arrow-right" className="size-5" />
      </ButtonV2>
      <ButtonV2 {...args} hierarchy="tertiary-gray" aria-label="Search">
        <Icon name="search" className="size-5" />
      </ButtonV2>
    </div>
  ),
};

/* `asChild` hands the styling to whatever element is passed — a link, usually. */
export const AsLink: Story = {
  args: { asChild: true, hierarchy: 'link-color' },
  render: (args) => (
    <ButtonV2 {...args}>
      <a href="#pricing">See pricing</a>
    </ButtonV2>
  ),
};
