export function getFontSizes(scale?: number): FontSizes {
  return {
    heading: "1.5rem",
    subheading: "1.2rem",
    input: "0.875rem",
    title: "0.95rem",
    subtitle: "0.85rem",
    body: "0.8rem",
    menu: "0.8rem",
    subBody: "0.750rem",
    code: "0.9rem",
  };
}

export type FontSizes = {
  heading: string;
  subheading: string;
  input: string;
  title: string;
  subtitle: string;
  body: string;
  menu: string;
  subBody: string;
  code: string;
};
