export const margins = {
  0: 0,
  1: 12,
  2: 20
};

export const getStyle = style => {
  if (!style) return {};
  return {
    marginTop: margins[style.marginTop] || 0,
    marginBottom: margins[style.marginBottom] || 0,
    textAlign: style.textAlign || 'left'
  };
};
