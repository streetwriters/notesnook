import { Flex, Link, Text } from "@theme-ui/components";
import { appVersion } from "../utils/version";

export function Hero() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        my: 150,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text variant="heading" sx={{ textAlign: "center" }}>
        Notesnook Importer
      </Text>
      <Text
        sx={{
          fontSize: "title",
          textAlign: "center",
          color: "fontTertiary",
        }}
      >
        Import your notes from any notes app into Notesnook.
      </Text>
      <Flex sx={{ mt: 2 }}>
        <Text variant="body" sx={{ px: 1 }}>
          v{appVersion}
        </Text>
        <Link
          href="https://github.com/streetwriters/notesnook"
          variant="text.body"
          sx={{ px: 1, borderLeft: "1px solid var(--theme-ui-colors-border)" }}
        >
          Github
        </Link>
        <Link
          href="https://app.notesnook.com/"
          variant="text.body"
          sx={{ px: 1, borderLeft: "1px solid var(--theme-ui-colors-border)" }}
        >
          Notesnook Web
        </Link>
      </Flex>
    </Flex>
  );
}
