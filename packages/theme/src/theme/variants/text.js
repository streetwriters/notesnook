class TextFactory {
  constructor() {
    return {
      default: new Default(),
      heading: new Heading(),
      title: new Title(),
      subtitle: new Subtitle(),
      body: new Body(),
      subBody: new SubBody(),
      error: new Error(),
    };
  }
}
export default TextFactory;

class Default {
  constructor() {
    return {
      color: "text",
      fontFamily: "body",
    };
  }
}

class Heading {
  constructor() {
    return {
      variant: "text.default",
      fontFamily: "heading",
      fontWeight: "bold",
      fontSize: "heading",
    };
  }
}

class Title {
  constructor() {
    return {
      variant: "text.heading",
      fontSize: "title",
    };
  }
}
class Subtitle {
  constructor() {
    return {
      variant: "text.heading",
      fontSize: "subtitle",
    };
  }
}

class Body {
  constructor() {
    return { variant: "text.default", fontSize: "body" };
  }
}

class SubBody {
  constructor() {
    return { variant: "text.default", fontSize: "subBody" };
  }
}

class Error {
  constructor() {
    return { variant: "text.default", fontSize: "subBody", color: "error" };
  }
}
