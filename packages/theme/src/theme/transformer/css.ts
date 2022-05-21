import { Theme } from "..";
import { SchemeColors } from "../colorscheme";

function transform(theme: Theme) {
  let root = ":root {";
  for (const color in theme.colors) {
    root += `--${color}: ${theme.colors[color as keyof SchemeColors]};`;
  }
  return root + "}";
}
export default transform;
