import { Checkbox, Flex, Label, Link, Text } from "@theme-ui/components";
import { useTelemetry } from "../utils/analytics";
import { appVersion } from "../utils/version";

export function Hero() {
  const { isEnabled, setIsEnabled } = useTelemetry();

  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: [50, 150],
        mb: [50, 100],
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
          mt: [2, 0],
        }}
      >
        Import your notes from any notes app into Notesnook.
      </Text>
      <Flex sx={{ mt: 2, alignItems: "center" }}>
        <Text variant="body" sx={{ px: 2 }}>
          v{appVersion}
        </Text>
        <Link
          href="https://github.com/streetwriters/notesnook"
          variant="text.body"
          sx={{ px: 2, borderLeft: "1px solid var(--theme-ui-colors-border)" }}
        >
          Github
        </Link>
        <Link
          href="https://app.notesnook.com/"
          variant="text.body"
          sx={{ px: 2, borderLeft: "1px solid var(--theme-ui-colors-border)" }}
        >
          Notesnook Web
        </Link>
        <Label
          variant="text.body"
          sx={{
            width: "auto",
            alignItems: "center",
            px: 2,
            borderLeft: "1px solid var(--theme-ui-colors-border)",
          }}
          title={`Currently the only thing sent is which provider you used after a successful import. This data is completely anonymous, of course.`}
        >
          <Checkbox
            sx={{ mr: 1 }}
            checked={isEnabled}
            onChange={() => setIsEnabled((s) => !s)}
          />
          Telemetry {isEnabled ? "enabled" : "disabled"}
        </Label>
      </Flex>
      <Flex
        sx={{
          bg: "bgSecondary",
          flexDirection: "column",
          width: ["90%", 400],
          mt: 4,
          p: 2,
          borderRadius: "default",
        }}
      >
        <Text variant="subtitle">What's new in v{appVersion}</Text>
        <Text variant="body" sx={{ whiteSpace: "pre-wrap" }}>
          {process.env.REACT_APP_CHANGELOG}
        </Text>
      </Flex>
    </Flex>
  );
}
