import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import WebsiteLayoutV2 from '@/components/layouts/website-layout-v2';

const meta = {
  title: 'Layouts/WebsiteLayoutV2',
  component: WebsiteLayoutV2,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The new-design shell: `NavbarV2` above the page, `FooterV2` below it. It exists alongside the legacy ' +
          '`WebsiteLayout` rather than replacing it, and takes over one screen at a time as each is rebuilt ' +
          '(ADR 0005).',
      },
    },
  },
  args: {
    children: (
      <main className="mx-auto flex min-h-[40vh] max-w-[1376px] items-center justify-center px-4 py-24">
        <p className="font-body text-lg-regular text-text-tertiary">Page content</p>
      </main>
    ),
  },
} satisfies Meta<typeof WebsiteLayoutV2>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2' } },
};
