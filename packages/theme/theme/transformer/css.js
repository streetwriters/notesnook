function transform(theme) {
  let root = ":root {";
  for (let color in theme.colors) {
    root += `--${color}: ${theme.colors[color]};`;
  }
  return root + "}";
}
export default transform;
