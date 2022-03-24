import { Flex, Box, Link, Text } from "@theme-ui/components";
import { appVersion } from "../utils/version";
import {
  MdOutlineShield,
  MdVpnKey,
  MdOutlineStorage,
  MdOutlineEnhancedEncryption,
} from "react-icons/md";
import { getAppUrl } from "../utils/links";

const Algorithms = [
  {
    key: "argon2",
    title: "Encryption key derivation (PKDF)",
    name: "Argon2",
    icon: MdVpnKey,
  },
  {
    key: "aes-gcm",
    title: "Encryption key storage",
    name: "AES-GCM 256",
    icon: MdOutlineStorage,
  },
  {
    key: "xchacha",
    title: "Data encryption",
    name: "XChaXCha-Poly1305-IETF",
    icon: MdOutlineEnhancedEncryption,
  },
];

export function Hero() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: 150,
        mb: 100,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        variant="heading"
        sx={{ textAlign: "center", display: "flex", alignItems: "center" }}
      >
        <MdOutlineShield /> Notesnook Vericrypt
      </Text>
      <Text
        sx={{
          fontSize: "title",
          textAlign: "center",
          color: "fontTertiary",
        }}
      >
        An open source utility to verify Notesnook data encryption in a
        verifiable &amp; easy way.
      </Text>
      <Flex sx={{ mt: 2, zIndex: 10 }}>
        <Text variant="body" sx={{ px: 1 }}>
          v{appVersion}
        </Text>
        <Link
          href={getAppUrl("vericrypt")}
          variant="text.body"
          sx={{ px: 1, borderLeft: "1px solid var(--theme-ui-colors-border)" }}
        >
          See source code
        </Link>
      </Flex>
      <Box
        sx={{
          mt: 100,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          rowGap: 2,
        }}
      >
        {Algorithms.map((alg) => (
          <Flex
            sx={{
              flexDirection: "column",
              mr: 4,
              p: 2,
              borderRadius: "default",
              bg: "black",
              width: 250,
            }}
            key={alg.key}
          >
            <alg.icon color={"var(--theme-ui-colors-fontSecondary)"} />
            <Text variant="subtitle" sx={{ color: "fontSecondary" }}>
              {alg.title}
            </Text>
            <Text
              variant="body"
              sx={{
                fontSize: "subtitle",
                color: "fontSecondary",
              }}
            >
              {alg.name}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}
