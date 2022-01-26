import { Flex, Link, Text } from "@theme-ui/components";
import { appVersion } from "../utils/version";
import {
  MdOutlineShield,
  MdVpnKey,
  MdOutlineStorage,
  MdOutlineEnhancedEncryption,
} from "react-icons/md";

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
      <Flex sx={{ mt: 2 }}>
        <Text variant="body" sx={{ px: 1 }}>
          v{appVersion}
        </Text>
        <Link
          href="https://github.com/streetwriters/notesnook"
          variant="text.body"
          sx={{ px: 1, borderLeft: "1px solid var(--theme-ui-colors-border)" }}
        >
          See source code
        </Link>
      </Flex>
      <Flex
        sx={{
          mt: 4,
          flexDirection: "column",
        }}
      >
        <Text
          variant="subheading"
          sx={{
            textAlign: "center",
          }}
        >
          Encryption algorithms
        </Text>
        <Flex sx={{ justifyContent: "space-between", mt: 2 }}>
          {Algorithms.map((alg) => (
            <Flex
              sx={{
                flexDirection: "column",
                mr: 4,
                p: 2,
                borderRadius: "default",
                border: "1px solid var(--theme-ui-colors-border)",
              }}
              key={alg.key}
            >
              <alg.icon color={"var(--theme-ui-colors-icon)"} />
              <Text variant="subtitle">{alg.title}</Text>
              <Text
                variant="body"
                sx={{
                  fontSize: "subtitle",
                }}
              >
                {alg.name}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
