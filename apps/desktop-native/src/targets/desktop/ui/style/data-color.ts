import type { DataColor } from "../../../../ui";

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function dataColor(hex: string): DataColor {
  if (!HEX.test(hex)) throw new Error(`"${hex}" is not a hex colour`);
  return hex as DataColor;
}
