const path = require('node:path');

const indexTemplate = (paths) => {
  const exportEntries = paths.map(({ path: filePath }) => {
    const basename = path.basename(filePath, path.extname(filePath));
    return `export * from './${basename}' `;
  });

  return exportEntries.join('\n');
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
  svgo: false,
  jsx: {
    babelConfig: {
      plugins: [
        [
          '@svgr/babel-plugin-add-jsx-attribute',
          {
            elements: ['svg'],
            attributes: [
              { name: 'fill', value: 'color', literal: true },
              { name: 'width', value: 'sizes[size]', literal: true },
              { name: 'height', value: 'sizes[size]', literal: true },
              { name: 'className', value: 'cn("inline-block shrink-0", className)', literal: true },
            ],
          },
        ],
      ],
    },
  },
  replaceAttrValues: {
    '#202023': '',
  },
  template({ componentName, jsx, interfaces }, { tpl }) {
    const exportName = componentName.replace('Svg', 'Icon');

    return tpl`
      ${interfaces}

      import {cn} from '@/libs/utils';

      import { type IconProps, sizes } from '../iconDefinition';
            
      export const ${exportName} = ({className, color="currentColor", size = 'fontSize', ...props}: IconProps) => (
        ${jsx}
      );
    `;
  },
  indexTemplate,
};
