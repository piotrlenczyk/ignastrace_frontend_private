import { cn } from './utils';

describe('cn', () => {
  it('drops falsy inputs and flattens arrays and objects', () => {
    expect(cn('flex', false, undefined, null, '')).toBe('flex');
    expect(cn(['flex', 'gap-1'], { 'items-center': true, 'hidden': false })).toBe('flex gap-1 items-center');
  });

  it('keeps classes that do not conflict', () => {
    expect(cn('flex', 'gap-1')).toBe('flex gap-1');
  });

  it('resolves stock utilities in favour of the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('resolves one semantic text colour against another', () => {
    expect(cn('text-strong', 'text-body')).toBe('text-body');
    expect(cn('text-error', 'text-information')).toBe('text-information');
    expect(cn('text-primary', 'text-secondary')).toBe('text-secondary');
  });

  it('resolves the hand-written text colour utilities against theme text colours', () => {
    expect(cn('text-strong', 'text-weak')).toBe('text-weak');
    expect(cn('text-success', 'text-error')).toBe('text-error');
  });

  it('resolves one semantic background colour against another', () => {
    expect(cn('bg-primary', 'bg-secondary')).toBe('bg-secondary');
    expect(cn('bg-brand-50', 'bg-brand-800')).toBe('bg-brand-800');
  });

  it('resolves the hand-written background utilities against each other and against theme colours', () => {
    expect(cn('bg-base', 'bg-weak')).toBe('bg-weak');
    expect(cn('bg-weak', 'bg-base')).toBe('bg-base');
    expect(cn('bg-base', 'bg-primary')).toBe('bg-primary');
  });

  it('resolves the custom font size against stock font sizes in both directions', () => {
    expect(cn('text-sm', 'text-caption')).toBe('text-caption');
    expect(cn('text-caption', 'text-sm')).toBe('text-sm');
    expect(cn('text-caption', 'text-base')).toBe('text-base');
  });

  it('keeps a text colour and a font size side by side despite the shared prefix', () => {
    expect(cn('text-strong', 'text-sm')).toBe('text-strong text-sm');
    expect(cn('text-caption', 'text-body')).toBe('text-caption text-body');
    expect(cn('text-weak', 'text-caption')).toBe('text-weak text-caption');
  });

  it('resolves the hand-written box-shadow utilities against each other and against stock shadows', () => {
    expect(cn('shadow-raised', 'shadow-raised-lg')).toBe('shadow-raised-lg');
    expect(cn('shadow-icon', 'shadow-raised')).toBe('shadow-raised');
    expect(cn('shadow-raised', 'shadow-none')).toBe('shadow-none');
  });

  it('resolves the hand-written animation-duration utilities against each other', () => {
    expect(cn('animation-duration-500', 'animation-duration-1000')).toBe('animation-duration-1000');
  });

  it('resolves the hand-written column-count utilities against each other and against stock columns', () => {
    expect(cn('columns-count-1', 'columns-count-2')).toBe('columns-count-2');
    expect(cn('columns-2', 'columns-count-3')).toBe('columns-count-3');
    expect(cn('columns-count-3', 'columns-2')).toBe('columns-2');
  });

  it('lets a caller override a single property of a component default', () => {
    expect(cn('text-strong text-sm px-4', 'text-error')).toBe('text-sm px-4 text-error');
    expect(cn('bg-base text-body', 'bg-primary')).toBe('text-body bg-primary');
  });
});
