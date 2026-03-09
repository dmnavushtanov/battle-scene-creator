export interface BuiltInMap {
  id: string;
  label: string;
  dataUrl: string;
}

const mapModules = {
  ...import.meta.glob('./**/*.png', { eager: true, import: 'default' }),
  ...import.meta.glob('./**/*.svg', { eager: true, import: 'default' }),
  ...import.meta.glob('./**/*.jpg', { eager: true, import: 'default' }),
  ...import.meta.glob('./**/*.jpeg', { eager: true, import: 'default' }),
  ...import.meta.glob('./**/*.webp', { eager: true, import: 'default' }),
} satisfies Record<string, string>;

const toLabel = (fileName: string): string => {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return baseName
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export const BUILT_IN_MAPS: BuiltInMap[] = Object.entries(mapModules)
  .map(([path, dataUrl]) => {
    const fileName = path.split('/').pop() ?? '';
    const id = fileName.replace(/\.[^.]+$/, '');
    return {
      id,
      label: toLabel(fileName),
      dataUrl,
    } satisfies BuiltInMap;
  })
  .sort((a, b) => a.label.localeCompare(b.label));
