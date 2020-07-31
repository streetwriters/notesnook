class ButtonFactory {
  constructor() {
    return {
      default: new Default(),
      primary: new Primary(),
      secondary: new Secondary(),
      tertiary: new Tertiary(),
      list: new List(),
      anchor: new Anchor(),
      menu: new Menu(),
      icon: new Icon(),
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
      borderRadius: "default",
      cursor: "pointer",
      ":focus": {
        outline: "none",
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
      transition: "opacity 300ms linear",
      ":hover": {
        opacity: 0.8,
      },
    };
  }
}

class Secondary {
  constructor() {
    return { variant: "buttons.default", color: "text", bg: "bgSecondary" };
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
    };
  }
}

class List {
  constructor() {
    return {
      variant: "buttons.tertiary",
      border: "0px solid",
      borderBottom: "1px solid",
      borderBottomColor: "border",
      borderRadius: 0,
      textAlign: "left",
      py: 2,
      px: 0,
      ":hover": {
        borderBottomColor: "primary",
      },
    };
  }
}

class Anchor {
  constructor() {
    return {
      variant: "buttons.default",
      color: "primary",
      fontSize: "subBody",
      p: 0,
      m: 0,
    };
  }
}

class Icon {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      borderRadius: "none",
      ":hover": {
        backgroundColor: "shade",
      },
    };
  }
}

class Menu {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      fontSize: 14,
      p: 2,
      borderRadius: "none",
      ":hover": {
        backgroundColor: "shade",
      },
    };
  }
}
