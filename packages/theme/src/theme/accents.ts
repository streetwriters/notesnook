const accents = {
  orange: "#FF5722",
  yellow: "#FFA000",
  green: "#1B5E20",
  green2: "#008837",
  gray: "#757575",
  blue: "#0560ff",
  teal: "#009688",
  lightblue: "#2196F3",
  indigo: "#880E4F",
  purple: "#9C27B0",
  pink: "#FF1744",
  red: "#B71C1C",
} as const;

export function getDefaultAccentColor() {
  return accents.green2;
}

export function getAllAccents(): { label: Accents; code: string }[] {
  return Object.entries(accents).map(([key, value]) => {
    return { label: key as Accents, code: value };
  });
}

export type Accents = keyof typeof accents;
