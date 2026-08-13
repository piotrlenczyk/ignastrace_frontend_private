import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NavbarV2 } from '@/components/navigation/v2/navbar';

const meta = {
  title: 'Components/NavbarV2',
  component: NavbarV2,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The new-design header. The desktop nav collapses below `lg`, where the hamburger takes over — switch ' +
          'the viewport to see the two states. The logo target depends on the route: reverse-lookup pages point at ' +
          'the reverse-lookup home, everything else at the site root.',
      },
    },
  },
} satisfies Meta<typeof NavbarV2>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

/* Below `lg`: nav links gone, hamburger in, language selector still visible. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};

/*
 * On a reverse-lookup route the logo links to the reverse-lookup home instead of
 * the site root — the one thing about this header that varies with the path.
 */
export const OnReverseLookupRoute: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/reverse-phone-lookup' } },
  },
};
