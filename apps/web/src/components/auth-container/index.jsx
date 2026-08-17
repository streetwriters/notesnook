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

import { useMemo } from "react";
import { Button, Flex, Image, Text } from "@theme-ui/components";
import { getRandom, usePromise } from "@notesnook/common";
import Holenstein from "../../assets/testimonials/holenstein.jpg";
import Jason from "../../assets/testimonials/jason.jpg";
import Cameron from "../../assets/testimonials/cameron.jpg";
import { hosts } from "@notesnook/core";
import { SettingsDialog } from "../../dialogs/settings";
import { strings } from "@notesnook/intl";
import { FixedColorSchemeThemeProvider } from "../theme-provider";

const testimonials = [
  {
    username: "HolensteinDan",
    image: Holenstein,
    name: "Dan Holenstein",
    link: "https://twitter.com/HolensteinDan/status/1439728355935342592",
    text: "@notesnook app is what @evernote should have become long ago. And they're still improving."
  },
  {
    username: "jasonbereklewis",
    image: Jason,
    name: "Jason Berek-Lewis",
    link: "https://twitter.com/jasonbereklewis/status/1438635808727044098",
    text: "I work in content writing and communications. My day starts and ends in Notesnook. My Chrome app is always open; it's where I take all my notes. The clean design, focus mode, the tagging and color coding are all features that help keep my work organised every day."
  },
  {
    username: "camflint",
    image: Cameron,
    name: "Cameron Flint",
    link: "https://twitter.com/camflint/status/1481061416434286592",
    text: "I'm pretty impressed at the progress @notesnook are making on their app — particularly in respect to how performant the app runs and behaves, despite the overhead of end-to-end encrypting user data."
  }
];

function getRandomTestimonial() {
  return testimonials[getRandom(0, testimonials.length - 1)];
}

function randomTitle() {
  return strings.webAuthTitles[
    getRandom(0, strings.webAuthTitles.length - 1)
  ]();
}

function AuthContainer(props) {
  const testimonial = useMemo(() => getRandomTestimonial(), []);
  const title = useMemo(() => randomTitle(), []);

  const version = usePromise(
    async () =>
      await fetch(`${hosts.API_HOST}/version`)
        .then((r) => r.json())
        .catch(() => undefined)
  );

  return (
    <Flex
      sx={{
        position: "relative",
        height: "100%",
        bg: "background"
      }}
    >
      <FixedColorSchemeThemeProvider
        colorScheme="dark"
        sx={{
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          display: ["none", "none", "flex"],
          flex: 1,
          background:
            "radial-gradient(1200px 700px at 82% 18%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 62%), var(--background-secondary)"
        }}
      >
        <Flex
          p={50}
          sx={{
            zIndex: 1,
            flex: 1,
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "end"
          }}
        >
          <svg
            style={{
              height: 90,
              width: 90,
              alignSelf: "start",
              marginBottom: 20
            }}
          >
            <use href="#full-logo" />
          </svg>
          <Text variant={"heading"} sx={{ fontSize: 48 }}>
            {title}
          </Text>
          <Text
            variant="body"
            mt={10}
            sx={{ fontSize: 16, color: "paragraph-secondary" }}
          >
            {testimonial.text}
          </Text>
          <Flex mt={2} sx={{ alignItems: "center", justifyContent: "center" }}>
            <Image
              src={testimonial.image}
              sx={{ borderRadius: 50, width: 40 }}
            />
            <Flex ml={2} sx={{ flexDirection: "column" }}>
              <Text variant="body" sx={{ fontSize: 16, fontWeight: "bold" }}>
                {testimonial.name}
              </Text>
              <Text variant="subBody" sx={{ fontSize: 13 }}>
                @{testimonial.username}
              </Text>
            </Flex>
          </Flex>

          <Flex
            mt={2}
            pt={2}
            sx={{
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              width: "100%"
            }}
          >
            <Text variant={"subBody"}>
              {version.status === "fulfilled" &&
              !!version.value &&
              version.value.instance !== "default" ? (
                <>
                  {strings.usingInstance(
                    version.value.instance,
                    version.value.version
                  )}
                </>
              ) : (
                <>{strings.usingOfficialInstance()}</>
              )}
            </Text>
            <Button
              variant="anchor"
              onClick={() => SettingsDialog.show({ activeSection: "servers" })}
            >
              {strings.configure()}
            </Button>
          </Flex>
        </Flex>
      </FixedColorSchemeThemeProvider>
      <FixedColorSchemeThemeProvider
        colorScheme="light"
        sx={{
          display: "flex",
          position: "relative",
          flex: 1.5,
          background: "var(--background-secondary)"
        }}
      >
        {props.children}
      </FixedColorSchemeThemeProvider>
    </Flex>
  );
}
export default AuthContainer;
