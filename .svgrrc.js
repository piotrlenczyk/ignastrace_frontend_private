const path = require('node:path');

/*
 * `AddFile` → `add-file`, `ArrowDown1` → `arrow-down-1`. The generator derives
 * the component name from the SVG file name, so this round-trips back to the
 * original `svgs/*.svg` basename — that name is what `<Icon name="…" />` takes.
 */
const kebabCase = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])([0-9])/g, '$1-$2')
    .toLowerCase();

const indexTemplate = (paths) => {
  const icons = paths.map(({ path: filePath }) => {
    const basename = path.basename(filePath, path.extname(filePath));
    return { basename, componentName: `Icon${basename}`, name: kebabCase(basename) };
  });

  const imports = icons.map(({ componentName, basename }) => `import { ${componentName} } from './${basename}';`);
  const reExports = icons.map(({ basename }) => `export * from './${basename}';`);
  const registryEntries = icons.map(({ name, componentName }) => `  '${name}': ${componentName},`);

  return [
    imports.join('\n'),
    reExports.join('\n'),
    [
      '/*',
      ' * The lookup table behind `<Icon name="…" />`. Generated alongside the',
      ' * components, so a new SVG in `svgs/` is available by name as soon as',
      ' * `npm run generate:icons` has run — there is nothing to register by hand.',
      ' */',
      'export const iconRegistry = {',
      registryEntries.join('\n'),
      '} as const;',
      '',
      'export type IconName = keyof typeof iconRegistry;',
    ].join('\n'),
  ].join('\n\n');
};

module.exports = {
  jsxRuntime: 'automatic',
  typescript: true,
  /*
   * SVGR bundles its own Prettier and resolves its own defaults, which do not
   * match .prettierrc.mjs — regenerating icons under it reformatted all 116
   * files. The `generate:icons` script runs the project's Prettier over the
   * output instead, so there is one formatting standard in the repository.
   */
  prettier: false,
  /*
   * SVGO runs with a single plugin, not `preset-default`: the exports are
   * already clean and the only transform we want is colour normalisation.
   * `currentColor: true` rewrites every colour attribute (fill, stroke,
   * stop-color, …) to `currentColor`, leaving `fill="none"` alone — so a
   * stroked icon stays hollow and every icon takes its colour from the
   * surrounding `text-*` class.
   */
  svgo: true,
  svgoConfig: {
    plugins: [{ name: 'convertColors', params: { currentColor: true } }],
  },
  jsx: {
    babelConfig: {
      plugins: [
        [
          '@svgr/babel-plugin-add-jsx-attribute',
          {
            elements: ['svg'],
            attributes: [
              /*
               * Icons are always emitted at 24×24 regardless of the source
               * artboard. Sizing is a CSS concern — override with `size-4`
               * and friends on `className`, or with an explicit `width`/
               * `height` prop, both of which win over these attributes.
               */
              { name: 'width', value: '24', literal: true },
              { name: 'height', value: '24', literal: true },
              { name: 'className', value: 'cn("inline-block shrink-0", className)', literal: true },
            ],
          },
        ],
      ],
    },
  },
  template({ componentName, jsx, interfaces }, { tpl }) {
    const exportName = componentName.replace('Svg', 'Icon');

    return tpl`
      ${interfaces}

      import {cn} from '@/libs/utils';

      import { type IconProps } from '../iconDefinition';

      export const ${exportName} = ({className, ...props}: IconProps) => (
        ${jsx}
      );
    `;
  },
  indexTemplate,
};
