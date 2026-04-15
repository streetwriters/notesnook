export const FontSizes = {
  XXS: 10,
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 32
};

export const FontFamily = {
  REGULAR: "Inter-Regular", // 400
  MEDIUM: "Inter-Medium", // 500
  SEMI_BOLD: "Inter-SemiBold", // 600
  BOLD: "Inter-Bold" // 700
};

export const getLineHeight = (
  fontSize: keyof typeof FontSizes,
  type: 1 | 2
) => {
  if (type === 1) return (FontSizes[fontSize] / 100) * 120;
  if (type === 2) return (FontSizes[fontSize] / 100) * 150;
};
