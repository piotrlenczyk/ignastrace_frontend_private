import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from '@/components/ui/icon';
import { ButtonV2 } from '@/components/ui/v2/button';

const HIERARCHIES = ['primary', 'secondary', 'tertiary', 'link-color', 'link-gray'] as const;

/* Icon only is defined for the three box hierarchies; the set draws no icon-only link. */
const BOX_HIERARCHIES = ['primary', 'secondary', 'tertiary'] as const;

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const meta = {
  title: 'Components/ButtonV2',
  component: ButtonV2,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The new-design button, built from `Buttons/Button` (10003:10813). `hierarchy`, `size` and `iconOnly` are ' +
          'the Figma component set’s own properties; its `State` axis is CSS (hover, focus-visible, disabled) plus ' +
          'the `loading` prop. The set defines no pressed state and no destructive modifier, so neither exists here.',
      },
    },
  },
  argTypes: {
    hierarchy: { control: 'select', options: HIERARCHIES },
    size: { control: 'select', options: SIZES },
    iconOnly: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    asChild: { table: { disable: true } },
  },
  args: { children: 'Button CTA' },
} satisfies Meta<typeof ButtonV2>;

export default meta;

type Story = StoryObj<typeof meta>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <tr>
    <th className="text-left font-body text-xs-medium whitespace-nowrap text-text-tertiary">{label}</th>
    {children}
  </tr>
);

const Header = () => (
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
);

export const Playground: Story = {};

/*
 * The full grid. The link hierarchies carry no padding and set their label in
 * medium rather than semibold, so their rows read as text at each size.
 */
export const Hierarchies: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <table className="border-separate border-spacing-4">
      <Header />
      <tbody>
        {HIERARCHIES.map((hierarchy) => (
          <Row key={hierarchy} label={hierarchy}>
            {SIZES.map((size) => (
              <td key={size}>
                <ButtonV2 {...args} hierarchy={hierarchy} size={size} />
              </td>
            ))}
          </Row>
        ))}
      </tbody>
    </table>
  ),
};

/*
 * Icons are slots rather than children so the 2px box the design puts around the
 * label stays measurable. Both slots take any node; the set draws them at 20px,
 * which the component enforces.
 */
export const WithIcons: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <table className="border-separate border-spacing-4">
      <Header />
      <tbody>
        {HIERARCHIES.map((hierarchy) => (
          <Row key={hierarchy} label={hierarchy}>
            {SIZES.map((size) => (
              <td key={size}>
                <ButtonV2
                  {...args}
                  hierarchy={hierarchy}
                  size={size}
                  iconLeading={<Icon name="search" />}
                  iconTrailing={<Icon name="arrow-right" />}
                />
              </td>
            ))}
          </Row>
        ))}
      </tbody>
    </table>
  ),
};

/* A square: 20px glyph plus even padding, giving the same 36/40/44/48 heights. */
export const IconOnly: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <table className="border-separate border-spacing-4">
      <Header />
      <tbody>
        {BOX_HIERARCHIES.map((hierarchy) => (
          <Row key={hierarchy} label={hierarchy}>
            {SIZES.map((size) => (
              <td key={size}>
                <ButtonV2
                  {...args}
                  hierarchy={hierarchy}
                  size={size}
                  iconOnly
                  iconLeading={<Icon name="search" />}
                  aria-label="Search"
                />
              </td>
            ))}
          </Row>
        ))}
      </tbody>
    </table>
  ),
};

/*
 * Only Primary gains a surface and a border when disabled. Secondary keeps its
 * white surface and swaps the border; Tertiary and the links only dim the text.
 */
export const Disabled: Story = {
  args: { disabled: true },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {HIERARCHIES.map((hierarchy) => (
        <ButtonV2 key={hierarchy} {...args} hierarchy={hierarchy} iconLeading={<Icon name="search" />} />
      ))}
    </div>
  ),
};

/*
 * `State=Loading`: the spinner replaces the leading icon, the trailing icon goes,
 * and the surface becomes that hierarchy's hover surface while the label keeps its
 * default colour. The button is disabled so a form cannot be submitted twice.
 */
export const Loading: Story = {
  args: { loading: true },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        {HIERARCHIES.map((hierarchy) => (
          <ButtonV2
            key={hierarchy}
            {...args}
            hierarchy={hierarchy}
            loadingLabel="Submitting..."
            iconLeading={<Icon name="search" />}
            iconTrailing={<Icon name="arrow-right" />}
          />
        ))}
      </div>
      {/* `loadingLabel={null}` is the set's `loadingText=false`: a spinner on its own. */}
      <div className="flex flex-wrap items-center gap-4">
        {BOX_HIERARCHIES.map((hierarchy) => (
          <ButtonV2 key={hierarchy} {...args} hierarchy={hierarchy} loadingLabel={null} />
        ))}
        {BOX_HIERARCHIES.map((hierarchy) => (
          <ButtonV2 key={`${hierarchy}-icon`} {...args} hierarchy={hierarchy} iconOnly aria-label="Submitting" />
        ))}
      </div>
    </div>
  ),
};

/*
 * `State=Focused`: two rings — 2px of `bg-primary` then 2px of
 * `effects-focus-ring` — so the ring reads on a coloured surface as well as a
 * white one.
 *
 * It is bound to `focus-visible`, not `focus`, which is why **clicking a button
 * shows no ring — press Tab instead**. The ring is for keyboard navigation, and a
 * mouse user who just clicked does not need to be told where they are; that is
 * the accessible default and what Untitled UI ships, so its absence on click is
 * deliberate rather than a gap. Figma's `State=Focused` does not distinguish the
 * two, so the file cannot settle it either way.
 *
 * Switching to plain `:focus` is a one-word change in `button.tsx` if the ring is
 * ever wanted on click as well.
 */
export const Focused: Story = {
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
 * `asChild` hands the styling to whatever element is passed — a link, usually.
 * Slot takes a single child, so the icon slots and the label box are not composed
 * around it; the caller owns the inner content.
 */
export const AsLink: Story = {
  args: { asChild: true, hierarchy: 'link-color' },
  render: (args) => (
    <ButtonV2 {...args}>
      <a href="#pricing">See pricing</a>
    </ButtonV2>
  ),
};
