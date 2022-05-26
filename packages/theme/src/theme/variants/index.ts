import { buttonVariants } from "./button";
import { inputVariants } from "./input";
import { textVariants } from "./text";
import { createFlexVariants } from "./flex";

export const variants = {
  buttons: buttonVariants,
  forms: inputVariants,
  text: textVariants,
  variants: {
    ...createFlexVariants("row"),
    ...createFlexVariants("column"),
  },
};
