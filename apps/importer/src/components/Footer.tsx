import { Flex, Text } from "@theme-ui/components";
import { appVersion } from "../utils/version";

export function Footer() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: 100,
        pt: 50,
        pb: 50,
        borderTop: "1px solid var(--theme-ui-colors-border)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant="body">Notesnook Importer (v{appVersion})</Text>
      <Text variant="subBody">© 2021 Streetwriters LLC</Text>
    </Flex>
  );
}
