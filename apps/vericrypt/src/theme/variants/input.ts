class InputFactory {
  constructor() {
    return {
      input: new Default(),
      error: new Error(),
      clean: new Clean(),
    };
  }
}
export default InputFactory;

class Default {
  constructor() {
    return {
      borderRadius: 5,
      border: "none",
      // borderColor: "border",
      boxShadow: "0px 0px 0px 1px var(--theme-ui-colors-border) inset",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "input",
      color: "text",
      outline: "none",
      ":focus": {
        boxShadow: "0px 0px 0px 1.5px var(--theme-ui-colors-primary) inset",
      },
      ":hover:not(:focus)": {
        boxShadow: "0px 0px 0px 1px var(--theme-ui-colors-dimPrimary) inset",
      },
    };
  }
}

class Clean {
  constructor() {
    return {
      outline: "none",
      border: "none",
    };
  }
}

class Error {
  constructor() {
    return {
      variant: "forms.input",
      boxShadow: "0px 0px 0px 1px var(--error) inset",
      outline: "none",
      ":focus": {
        boxShadow: "0px 0px 0px 1.5px var(--error) inset",
      },
      ":hover:not(:focus)": {
        boxShadow: "0px 0px 0px 1px var(--error) inset",
      },
    };
  }
}
