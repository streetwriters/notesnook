import { getButtonVariants } from "./button";
import { getInputVariants } from "./input";
import { getTextVariants } from "./text";
import { createFlexVariants } from "./flex";
import { SxProps, SxStyleProp } from "rebass";

export function getVariants() {
  return {
    buttons: getButtonVariants(),
    forms: getInputVariants(),
    text: getTextVariants(),
    variants: {
      ...createFlexVariants("row"),
      ...createFlexVariants("column"),
    },
  };
}

export type Variants = Record<string, SxStyleProp>;
