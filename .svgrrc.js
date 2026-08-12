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
  prettier: true,
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
      
      /* eslint-disable simple-import-sort/imports  */
      /* eslint-disable import/newline-after-import  */

      import {cn} from '@/libs/utils';

      import { type IconProps, sizes } from '../iconDefinition';
            
      export const ${exportName} = ({className, color="currentColor", size = 'fontSize', ...props}: IconProps) => (
        ${jsx}
      );
    `;
  },
  indexTemplate,
};
