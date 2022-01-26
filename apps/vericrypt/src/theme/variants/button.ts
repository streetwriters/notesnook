class ButtonFactory {
  constructor() {
    return {
      default: new Default(),
      primary: new Primary(),
      secondary: new Secondary(),
      tertiary: new Tertiary(),
    };
  }
}
export default ButtonFactory;

class Default {
  constructor() {
    return {
      bg: "transparent",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "body",
      borderRadius: "5px",
      cursor: "pointer",
      p: 1,
      px: 2,
      transition: "filter 200ms ease-in, box-shadow 200ms ease-out",
      ":hover:not(:disabled)": {
        filter: "brightness(90%)",
      },
      ":active": {
        filter: "brightness(98%)",
      },
      outline: "none",
      ":focus-visible:not(:active)": {
        boxShadow: "0px 0px 0px 2px var(--text)",
      },
      ":disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    };
  }
}

class Primary {
  constructor() {
    return {
      variant: "buttons.default",
      color: "static",
      bg: "primary",
    };
  }
}

class Secondary {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      bg: "border",
    };
  }
}

class Tertiary {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      bg: "transparent",
      border: "2px solid",
      borderColor: "border",
      ":hover": {
        borderColor: "primary",
      },
    };
  }
}
