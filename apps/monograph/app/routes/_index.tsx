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

import { MetaFunction } from "@remix-run/node";
import { generateMetaDescriptors } from "../utils/meta";
import {
  Box,
  Button,
  ButtonProps,
  Flex,
  LinkProps,
  Text
} from "@theme-ui/components";
import {
  mdiDeleteForeverOutline,
  mdiLockOutline,
  mdiShareOutline
} from "@mdi/js";
import { MonographChat } from "../components/monograph-chat";
import { Icon } from "@notesnook/ui";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { ForwardRef } from "@theme-ui/components/dist/declarations/src/types";
import { PUBLIC_URL } from "../utils/env";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return generateMetaDescriptors({
    titleShort: "Monograph",
    titleFull: "Monograph",
    type: "website",
    url: PUBLIC_URL,
    imageUrl: `${PUBLIC_URL}/social.png`,
    description:
      "Anonymous, secure and encrypted note sharing with password protection."
  });
};

export async function loader() {
  return { publicUrl: PUBLIC_URL };
}

const ButtonLink = Button as ForwardRef<
  HTMLButtonElement,
  ButtonProps & LinkProps
>;

const features = [
  {
    name: "Share notes",
    body: `Share a note with anyone on the internet even if they do not use Notesnook using a private sharable url.`,
    Icon: mdiShareOutline
  },
  {
    name: "Password protection",
    body: `Keep important and secret information from getting into wrong hands. Encrypt monograph with a password before sharing.`,
    Icon: mdiLockOutline
  },
  {
    name: "Self destruct",
    body: `Want a monograph to be viewable only once? Use self-destruct feature to delete the monograph once it is accessed.`,
    Icon: mdiDeleteForeverOutline
  }
];
export default function Monograph() {
  const { publicUrl } = useLoaderData<typeof loader>();

  return (
    <Flex
      sx={{
        flexDirection: "column",
        width: "100%",
        gap: 3,
        bg: "background"
      }}
    >
      <Header />
      <Flex
        sx={{
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Text
          as="h1"
          sx={{
            fontFamily: "monospace",
            textAlign: "center",
            mt: 100,
            mb: 2,
            fontSize: 42
          }}
        >
          <span style={{ color: "var(--accent)" }}>Mono</span>graph
        </Text>
        <Text
          sx={{
            textAlign: "center"
          }}
        >
          Anonymous, secure and encrypted note sharing with password protection
        </Text>
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 2
          }}
          mt={6}
        >
          <ButtonLink
            variant="accent"
            href="https://app.notesnook.com/"
            target="_blank"
          >
            Publish a note
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            sx={{
              bg: "background-secondary",
              border: "1px solid var(--border)"
            }}
            href="https://help.notesnook.com/publish-notes-with-monographs"
            target="_blank"
          >
            How it works
          </ButtonLink>
        </Flex>

        <MonographChat
          sx={{
            maxWidth: ["95%", 700],
            mt: 50,
            border: "1px solid var(--border)",
            boxShadow: "0px -5px 15px 0px rgba(0,0,0,0.05)"
          }}
          publicUrl={publicUrl}
        />
      </Flex>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 3,
          mx: [2, "5%"],
          mt: 100,
          mb: 200
        }}
      >
        {features.map((feature) => (
          <Flex
            key={feature.name}
            sx={{
              flexDirection: "column",
              border: "1px solid var(--border)",
              bg: "background-secondary",
              alignItems: "start",
              justifyContent: "start",
              gap: 1,
              padding: ["25px", "50px"],
              borderRadius: 20
            }}
          >
            <Icon path={feature.Icon} color="var(--accent)" size={42} />
            <Text variant="heading">{feature.name}</Text>
            <Text>{feature.body}</Text>
          </Flex>
        ))}
      </Box>
      <Footer />
    </Flex>
  );
}
