import { SxStyleProp } from "rebass";

type FlexDirection = "row" | "column";
export type FlexVariants<T extends FlexDirection> = T extends "row"
  ? {
      rowCenter: SxStyleProp;
      rowFill: SxStyleProp;
      rowCenterFill: SxStyleProp;
    }
  : {
      columnCenter: SxStyleProp;
      columnFill: SxStyleProp;
      columnCenterFill: SxStyleProp;
    };

export function createFlexVariants<T extends FlexDirection>(
  direction: T
): FlexVariants<T> {
  const variants = {
    Center: createCenterVariant(direction),
    Fill: createFillVariant(direction),
    CenterFill: createCenterFillVariant(direction),
  };
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      return [`${direction}${key}`, value];
    })
  ) as FlexVariants<T>;
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
