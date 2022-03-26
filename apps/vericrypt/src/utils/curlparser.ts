const LITERAL_NAMES = {
  CURL: "curl",
  INCLUDE_HEADERS: "include-headers",
  SILENT: "run-silent",
  USE_GET: "use-get",
  COMPRESSED: "compressed",
  STATES: {
    HEADER: "header-state",
    CUSTOM_METHOD: "custom-method-state",
    DATA: "data-state",
    USER: "user-state",
  },
  STRING: "string",
  OTHERS: "others",
};

const literals = [
  {
    regex: /^\bcurl\b/,
    name: LITERAL_NAMES.CURL,
  },
  {
    regex: /^(-H|--header)/,
    name: LITERAL_NAMES.STATES.HEADER,
  },
  {
    regex: /^-X/,
    name: LITERAL_NAMES.STATES.CUSTOM_METHOD,
  },
  {
    regex: /^(-u|--user)/,
    name: LITERAL_NAMES.STATES.USER,
  },
  {
    regex: /^(-d|--data-raw|--data-ascii|--data)/,
    name: LITERAL_NAMES.STATES.DATA,
  },
  {
    regex: /^--compressed/,
    name: LITERAL_NAMES.COMPRESSED,
  },
  {
    regex: /^(-i|--include)/,
    name: LITERAL_NAMES.INCLUDE_HEADERS,
  },
  {
    regex: /^(-s|--silent)/,
    name: LITERAL_NAMES.SILENT,
  },
  {
    regex: /^(-G|--get)/,
    name: LITERAL_NAMES.USE_GET,
  },
  {
    regex: /^'[^']*'/,
    name: LITERAL_NAMES.STRING,
  },
  {
    regex: /^"[^"]*"/,
    name: LITERAL_NAMES.STRING,
  },
  {
    regex: /^[^\n\r\s]*/,
    name: LITERAL_NAMES.STRING,
  },
  {
    regex: /^.*/,
    name: LITERAL_NAMES.OTHERS,
  },
];

const trimValue = (val: string) =>
  val
    .trim()
    .replace(/^('|")\s*/, "")
    .replace(/\s*('|")$/, "");

const isURL = (val: string) =>
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/.test(
    val
  );

type Token = { name: string; value: RegExpMatchArray | null };
type ParsedCurlRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: string;
};

export function parseCURL(curlCmd: string) {
  let cmd = curlCmd.trim();
  const tokens: Token[] = [];
  const result: ParsedCurlRequest = {
    url: "",
    method: "GET",
    headers: {} as Record<string, string>,
    data: "",
  };
  while (cmd) {
    for (const literal of literals) {
      if (literal.regex.test(cmd)) {
        tokens.push({
          name: literal.name,
          value: cmd.match(literal.regex),
        });

        cmd = cmd.replace(literal.regex, "").trim();
      }
    }
  }

  if (tokens.length) {
    if (tokens.shift()?.name !== "curl") {
      throw new Error("Not a curl command.");
    }

    let state = "";
    tokens.forEach((token) => {
      if (!token.value) return;

      if (!state) {
        switch (token.name) {
          case LITERAL_NAMES.STATES.HEADER:
            state = LITERAL_NAMES.STATES.HEADER;
            break;
          case LITERAL_NAMES.STATES.DATA:
            state = LITERAL_NAMES.STATES.DATA;
            break;
          case LITERAL_NAMES.STATES.CUSTOM_METHOD:
            state = LITERAL_NAMES.STATES.CUSTOM_METHOD;
            break;
          case LITERAL_NAMES.STATES.USER:
            state = LITERAL_NAMES.STATES.USER;
            break;
          case LITERAL_NAMES.STRING: {
            const val = trimValue(token.value[0]);
            if (isURL(val)) {
              result.url = val;
            }
            break;
          }
        }
      } else {
        switch (state) {
          case LITERAL_NAMES.STATES.HEADER: {
            const pair = trimValue(token.value[0]).split(/\s*:\s*/);
            result.headers[pair[0]] = pair[1];
            break;
          }
          case LITERAL_NAMES.STATES.DATA: {
            console.log(token);
            const pair = token.value[0];
            result.data = trimValue(pair).trim();
            break;
          }
          case LITERAL_NAMES.STATES.CUSTOM_METHOD: {
            const pair = token.value[0];
            result.method = trimValue(pair).trim();
            break;
          }
        }
        state = "";
      }
    });
  }

  return result;
}
