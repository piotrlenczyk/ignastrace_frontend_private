import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { remToPx, type TextStyle, textStyles } from './tokens';

const SAMPLE = 'Reverse phone lookup — 0123456789';

const Specimen = ({ style, sample }: { style: TextStyle; sample: string }) => (
  <div className="flex flex-col gap-2 border-b border-border-secondary py-5 lg:flex-row lg:items-baseline lg:gap-8">
    <div className="flex shrink-0 flex-col gap-0.5 lg:w-72">
      <code className="font-body text-sm-medium text-text-primary">
        text-{style.name} font-{style.family}
      </code>
      <span className="font-body text-xs-regular text-text-tertiary">
        {remToPx(style.fontSize)} / {remToPx(style.lineHeight)} · {style.fontWeight}
        {style.letterSpacing !== 'normal' && ` · ${style.letterSpacing}`}
      </span>
    </div>
    <p
      className="min-w-0 text-text-primary"
      style={{
        fontFamily: `var(--font-${style.family})`,
        fontSize: `var(--text-${style.name})`,
        lineHeight: `var(--text-${style.name}--line-height)`,
        fontWeight: `var(--text-${style.name}--font-weight)`,
        letterSpacing: `var(--text-${style.name}--letter-spacing, normal)`,
      }}
    >
      {sample}
    </p>
  </div>
);

const Scale = ({ family, sample }: { family: TextStyle['family']; sample: string }) => (
  <div className="flex flex-col p-6">
    {textStyles
      .filter((style) => style.family === family)
      .map((style) => (
        <Specimen key={style.name} style={style} sample={sample} />
      ))}
  </div>
);

type TypographyArgs = { sample: string };

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The named text styles from `src/styles/new/typo.css`. A style sets size, line height, weight and ' +
          'tracking — never the family — so each one is applied as a pair: `text-lg-semibold font-body`. ' +
          'Both families resolve to Inter in this design; the split is kept because the Figma file keeps it.',
      },
    },
  },
  argTypes: {
    sample: { control: 'text', description: 'Text rendered in every specimen' },
  },
  args: { sample: SAMPLE },
} satisfies Meta<TypographyArgs>;

export default meta;

type Story = StoryObj<TypographyArgs>;

/* Headings and hero copy — pair with `font-display`. */
export const Display: Story = {
  render: ({ sample }) => <Scale family="display" sample={sample} />,
};

/* Everything else — pair with `font-body`. */
export const Body: Story = {
  render: ({ sample }) => <Scale family="body" sample={sample} />,
};
