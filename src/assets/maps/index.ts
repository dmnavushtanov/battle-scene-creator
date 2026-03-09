export interface BuiltInMap {
  id: string;
  label: string;
  dataUrl: string;
}

const base = import.meta.env.BASE_URL;

export const BUILT_IN_MAPS: BuiltInMap[] = [
  {
    id: "default-map",
    label: "Default Map",
    dataUrl: `${base}maps/default-map.png`,
  },
  {
    id: "library-map",
    label: "Library Map",
    dataUrl: `${base}maps/library-map.png`,
  },
];

