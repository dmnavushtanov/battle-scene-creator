const iconModules = {
  ...import.meta.glob('./*.png', { eager: true, import: 'default' }),
  ...import.meta.glob('./*.svg', { eager: true, import: 'default' }),
  ...import.meta.glob('./*.jpg', { eager: true, import: 'default' }),
  ...import.meta.glob('./*.webp', { eager: true, import: 'default' }),
} satisfies Record<string, string>;

const iconEntries = Object.entries(iconModules).map(([path, url]) => {
  const fileName = path.split('/').pop() ?? '';
  const key = fileName.replace(/\.[^.]+$/, '');
  return [key, url] as const;
});

/** Map of unit type to its icon image URL */
export const UNIT_ICON_URLS: Record<string, string> = Object.fromEntries(iconEntries);

/** Available unit icon keys inferred from files in this directory. */
export const UNIT_ICON_KEYS = Object.keys(UNIT_ICON_URLS);
