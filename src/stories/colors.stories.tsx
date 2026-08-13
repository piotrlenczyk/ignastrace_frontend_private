import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { primitiveColorGroups, semanticColorGroups, type Token, type TokenGroup } from './tokens';

/*
 * How each namespace reaches markup. Spelled out because the token name alone
 * does not say it: `fg-brand-primary` is a foreground colour, so it is applied
 * with `text-`, not `fg-`.
 */
const USAGE: Record<string, string> = {
  alpha: 'bg-alpha-*',
  bg: 'bg-*',
  border: 'border-*',
  components: 'bg-* · text-* · border-*',
  effects: 'ring-* · shadow-*',
  fg: 'text-* — icons and glyphs',
  text: 'text-*',
  utility: 'bg-* · text-* · border-*',
};

/* Behind translucent swatches, so alpha tokens read as translucent. */
const CHECKERBOARD = {
  backgroundImage: `
    linear-gradient(45deg, var(--color-bg-tertiary) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-bg-tertiary) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-bg-tertiary) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-bg-tertiary) 75%)
  `,
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
};

const Swatch = ({ token }: { token: Token }) => {
  const isAlias = token.declared !== token.value;

  return (
    <figure className="flex flex-col gap-2">
      <div className="h-16 w-full overflow-hidden rounded-md border border-border-secondary" style={CHECKERBOARD}>
        <div className="size-full" style={{ background: `var(${token.variable})` }} />
      </div>
      <figcaption className="flex flex-col gap-0.5">
        <span className="font-body text-sm-medium break-all text-text-primary">{token.name}</span>
        <span className="font-body text-xs-regular text-text-tertiary uppercase">{token.value}</span>
        {isAlias && <span className="font-body text-xs-regular text-text-quaternary">{token.declared}</span>}
      </figcaption>
    </figure>
  );
};

const Palette = ({ groups, filter }: { groups: TokenGroup[]; filter: string }) => {
  const needle = filter.trim().toLowerCase();
  const matching = groups
    .map((group) => ({ ...group, tokens: group.tokens.filter((token) => token.name.includes(needle)) }))
    .filter((group) => group.tokens.length > 0);

  return (
    <div className="flex flex-col gap-10 p-6">
      {matching.map((group) => (
        <section key={group.name} className="flex flex-col gap-4">
          <header className="flex flex-col gap-1 border-b border-border-secondary pb-2">
            <h2 className="font-display text-lg-semibold text-text-primary">{group.name}</h2>
            {USAGE[group.name] && <p className="font-body text-sm-regular text-text-tertiary">{USAGE[group.name]}</p>}
          </header>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-6">
            {group.tokens.map((token) => (
              <Swatch key={token.name} token={token} />
            ))}
          </div>
        </section>
      ))}
      {matching.length === 0 && (
        <p className="font-body text-md-regular text-text-tertiary">No token matches “{filter}”.</p>
      )}
    </div>
  );
};

type PaletteArgs = { filter: string };

const meta = {
  title: 'Foundations/Colors',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every colour in the new design, read straight out of the generated token files in `src/styles/new`. ' +
          'Markup names semantics; primitives are the scale they resolve to and should not be referenced directly.',
      },
    },
  },
  argTypes: {
    filter: { control: 'text', description: 'Substring match on the token name' },
  },
  args: { filter: '' },
} satisfies Meta<PaletteArgs>;

export default meta;

type Story = StoryObj<PaletteArgs>;

/* The vocabulary for new markup: intent, not hue. */
export const Semantic: Story = {
  render: ({ filter }) => <Palette groups={semanticColorGroups} filter={filter} />,
};

/* The scale underneath. Here to look values up, not to use. */
export const Primitives: Story = {
  render: ({ filter }) => <Palette groups={primitiveColorGroups} filter={filter} />,
};
