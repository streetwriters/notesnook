class InputFactory {
  constructor() {
    return {
      input: new Default(),
      error: new Error(),
    };
  }
}
export default InputFactory;

class Default {
  constructor() {
    return {
      borderRadius: "default",
      border: "none",
      // borderColor: "border",
      boxShadow: "0px 0px 0px 1px var(--border)",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "input",
      color: "text",
      ":focus, :focus-within": {
        outline: "none",
        boxShadow: "0px 0px 0px 2px var(--primary)",
      },
      ":hover:not(:focus)": {
        boxShadow: "0px 0px 0px 1px var(--dimPrimary)",
      },
    };
  }
}

class Error {
  constructor() {
    return {
      variant: "forms.input",
      borderColor: "red",
      ":focus": {
        outline: "none",
        borderColor: "red",
      },
      ":hover": {
        borderColor: "darkred",
      },
    };
  }
}
