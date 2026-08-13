import { type IconProps } from './iconDefinition';
import { type IconName, iconRegistry } from './icons';

export type IconComponentProps = IconProps & {
  /*
   * The SVG file name under `svgs/`, e.g. `add-file` for `svgs/add-file.svg`.
   * `iconRegistry` is generated from that directory, so the union is always
   * exactly the set of icons that exist.
   */
  name: IconName;
};

/*
 * The single entry point for every generated icon: `<Icon name="search" />`
 * instead of importing `IconSearch`. Sizing and colour still come from
 * `className` (`size-5 text-text-brand-primary`), which the generated
 * components merge over their own defaults.
 */
export const Icon = ({ name, ...props }: IconComponentProps) => {
  const IconComponent = iconRegistry[name];

  return <IconComponent {...props} />;
};
