class FlexFactory {
  constructor(direction) {
    const variants = {
      Center: new Center(direction),
      Fill: new Fill(direction),
      CenterFill: new CenterFill(direction)
    };
    return Object.fromEntries(
      Object.entries(variants).map(([key, value]) => {
        return [`${direction}${key}`, value];
      })
    );
  }
}
export default FlexFactory;

class Center {
  constructor(direction) {
    return {
      justifyContent: "center",
      alignItems: "center",
      flexDirection: direction
    };
  }
}

class Fill {
  constructor(direction) {
    return {
      flex: "1 1 auto",
      flexDirection: direction
    };
  }
}

class CenterFill {
  constructor(direction) {
    return {
      variant: `variants.${direction}Center`,
      flex: "1 1 auto",
      flexDirection: direction
    };
  }
}
