class TextFactory {
  constructor() {
    return {
      default: new Default(),
      heading: new Heading(),
      subheading: new Subheading(),
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

class Subheading {
  constructor() {
    return {
      variant: "text.heading",
      fontSize: "subheading",
    };
  }
}

class Title {
  constructor() {
    return {
      variant: "text.heading",
      fontSize: "title",
      fontWeight: "bold",
    };
  }
}
class Subtitle {
  constructor() {
    return {
      variant: "text.heading",
      fontSize: "subtitle",
      fontWeight: "bold",
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
    return {
      variant: "text.default",
      fontSize: "subBody",
      color: "fontTertiary",
    };
  }
}

class Error {
  constructor() {
    return { variant: "text.default", fontSize: "subBody", color: "error" };
  }
}
