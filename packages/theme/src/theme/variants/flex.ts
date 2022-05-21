import { SxStyleProp } from "rebass";
import { Variants } from ".";

type FlexDirection = "row" | "column";
export function createFlexVariants(direction: FlexDirection): Variants {
  const variants: Variants = {
    Center: createCenterVariant(direction),
    Fill: createFillVariant(direction),
    CenterFill: createCenterFillVariant(direction),
  };
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      return [`${direction}${key}`, value];
    })
  );
}

function createCenterVariant(direction: FlexDirection): SxStyleProp {
  return {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: direction,
  };
}

function createFillVariant(direction: FlexDirection): SxStyleProp {
  return {
    flex: "1 1 auto",
    flexDirection: direction,
  };
}

function createCenterFillVariant(direction: FlexDirection): SxStyleProp {
  return {
    variant: `variants.${direction}Center`,
    flex: "1 1 auto",
    flexDirection: direction,
  };
}
