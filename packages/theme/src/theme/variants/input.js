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
      border: "2px solid",
      borderColor: "border",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "input",
      color: "text",
      ":focus": {
        outline: "none",
        borderColor: "primary",
      },
      ":hover": {
        borderColor: "dimPrimary",
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
