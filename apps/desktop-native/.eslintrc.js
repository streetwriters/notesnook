const RESTRICTED_PACKAGES = [
  "react-native",
  "react-native/*",
  "react-native-*",
  "react-native-*/**",
  "@react-native/*",
  "@react-native-*/**",
  "react-dom",
  "react-dom/*",
  "theme-ui",
  "@theme-ui/*",
  "@emotion/*",
  "@notesnook/ui",
  "@notesnook/ui/*",
  "@floating-ui/*",
  "react-virtuoso",
  "@dnd-kit/*",
  "react-modal"
];

const TARGET_PATHS = ["**/targets", "**/targets/**"];

module.exports = {
  overrides: [
    {
      files: ["src/app/**/*.{ts,tsx,js,jsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: RESTRICTED_PACKAGES,
                message:
                  "Shared code imports only @ui, @platform, @notesnook/* and platform-free libraries."
              },
              {
                group: TARGET_PATHS,
                message: "Shared code must not import a target directly."
              }
            ]
          }
        ],
        "no-restricted-globals": [
          "error",
          { name: "window", message: "Use @platform." },
          { name: "document", message: "Use @platform." },
          { name: "navigator", message: "Use @platform." },
          { name: "localStorage", message: "Use @platform." },
          { name: "sessionStorage", message: "Use @platform." },
          { name: "location", message: "Use @platform." }
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "JSXAttribute[name.name='className']",
            message: "className is not part of the styling contract."
          }
        ]
      }
    }
  ]
};
