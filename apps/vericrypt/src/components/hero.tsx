/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { Flex, Box, Link, Text } from "@theme-ui/components";
import { appVersion } from "../utils/version";
import {
  MdOutlineShield,
  MdVpnKey,
  MdOutlineStorage,
  MdOutlineEnhancedEncryption
} from "react-icons/md";
import { getAppUrl } from "../utils/links";

const Algorithms = [
  {
    key: "argon2",
    title: "Encryption key derivation (PKDF)",
    name: "Argon2",
    icon: MdVpnKey
  },
  {
    key: "aes-gcm",
    title: "Encryption key storage",
    name: "AES-GCM 256",
    icon: MdOutlineStorage
  },
  {
    key: "xchacha",
    title: "Data encryption",
    name: "XChaXCha-Poly1305-IETF",
    icon: MdOutlineEnhancedEncryption
  }
];

export function Hero() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: 150,
        mb: 100,
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <Text
        variant="heading"
        sx={{
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          fontSize: 52
        }}
      >
        <MdOutlineShield /> Notesnook Vericrypt
      </Text>
      <Text
        sx={{
          fontSize: "subheading",
          textAlign: "center",
          color: "fontTertiary"
        }}
      >
        An open source utility to verify Notesnook data encryption claims in a
        provable way.
      </Text>
      <Flex sx={{ mt: 2, zIndex: 10 }}>
        <Text variant="body" sx={{ px: 1 }}>
          v{appVersion}
        </Text>
        <Link
          href={getAppUrl("vericrypt")}
          variant="text.body"
          sx={{ px: 1, borderLeft: "1px solid var(--border)" }}
        >
          See source code
        </Link>
      </Flex>
      <Box
        sx={{
          mt: 100,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          rowGap: 2
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
              width: 250
            }}
            key={alg.key}
          >
            <alg.icon color={"var(--fontSecondary)"} />
            <Text variant="subtitle" sx={{ color: "fontSecondary" }}>
              {alg.title}
            </Text>
            <Text
              variant="body"
              sx={{
                fontSize: "subtitle",
                color: "fontSecondary"
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
