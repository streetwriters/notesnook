import {
  Extension,
  InputRule,
  InputRuleFinder,
  ExtendedRegExpMatchArray,
} from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    datetime: {
      /**
       * Insert time at current position
       */
      insertTime: () => ReturnType;
      /**
       * Insert date at current position
       */
      insertDate: () => ReturnType;

      /**
       * Insert date & time at current position
       */
      insertDateTime: () => ReturnType;
    };
  }
}

export const DateTime = Extension.create({
  name: "datetime",
  addKeyboardShortcuts() {
    return {
      "Alt-t": ({ editor }) => editor.commands.insertTime(),
      "Alt-d": ({ editor }) => editor.commands.insertDate(),
      "Mod-Alt-d": ({ editor }) => editor.commands.insertDateTime(),
    };
  },

  addCommands() {
    return {
      insertDate:
        () =>
        ({ commands }) =>
          commands.insertContent(currentDate()),
      insertTime:
        () =>
        ({ commands }) =>
          commands.insertContent(currentTime()),
      insertDateTime:
        () =>
        ({ commands }) =>
          commands.insertContent(currentDateTime()),
    };
  },

  addInputRules() {
    return [
      shortcutInputRule({
        shortcut: "/time",
        replace: () => {
          return currentTime();
        },
      }),
      shortcutInputRule({
        shortcut: "/date",
        replace: () => {
          return currentDate();
        },
      }),
      shortcutInputRule({
        shortcut: "/now",
        replace: () => {
          return currentDateTime();
        },
      }),
    ];
  },
});

function currentTime() {
  return new Date().toLocaleTimeString(undefined, {
    second: undefined,
    minute: "2-digit",
    hour12: true,
    hour: "2-digit",
  });
}

function currentDateTime() {
  return new Date().toLocaleString(undefined, {
    second: undefined,
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    year: "numeric",
    month: "2-digit",
  });
}

function currentDate() {
  return new Date().toLocaleDateString();
}

function shortcutInputRule(config: {
  shortcut: string;
  replace: () => string;
}) {
  const regex = new RegExp(`(^| )${config.shortcut}(\\s)`);
  return textInputRule({
    find: regex,
    replace: (match) => {
      const endToken = match[2] === "\n" ? "" : match[2];
      return `${match[1]}${config.replace()}${endToken}`;
    },
    after: ({ match, state, range }) => {
      const newlineRequested = match[2] === "\n";
      if (newlineRequested) state.tr.split(state.tr.mapping.map(range.to));
    },
  });
}

function textInputRule(config: {
  find: InputRuleFinder;
  replace: (match: ExtendedRegExpMatchArray) => string;
  after?: InputRule["handler"];
}) {
  return new InputRule({
    find: config.find,
    handler: (props) => {
      const { state, range, match } = props;
      let insert = config.replace(match);
      let start = range.from;
      const end = range.to;

      state.tr.insertText(insert, start, end);

      if (config.after) config.after(props);
    },
  });
}
