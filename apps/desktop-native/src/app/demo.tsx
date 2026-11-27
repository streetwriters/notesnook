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

import { useRef, useState } from "react";
import { Box, Button, Flex, Grid, Input, Text } from "@notesnook/ui-kit";
import type { BootState } from "./boot";

export type Status =
  | BootState
  | { status: "loading" }
  | { status: "error"; message: string };

export function Demo(props: {
  state: Status;
  colorScheme: "light" | "dark";
  onToggleColorScheme: () => void;
}) {
  const renders = useRef(0);
  renders.current++;
  const { state } = props;
  const [text, setText] = useState("");
  const [faded, setFaded] = useState(false);
  const [shown, setShown] = useState(false);

  return (
    <Flex
      data-test-id="root"
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flex: 1,
        bg: "background"
      }}
    >
      <Text data-test-id="title" sx={{ fontSize: "heading", color: "heading" }}>
        Notesnook
      </Text>
      <Text data-test-id="boot-state" sx={{ color: "paragraph" }}>
        {state.status === "loading"
          ? "Loading"
          : state.status === "error"
          ? `Error: ${state.message}`
          : state.user
          ? `Logged in as ${state.user.email}`
          : "Logged out"}
      </Text>
      {state.status === "ready" ? (
        <Text data-test-id="boot-info" sx={{ color: "paragraph-secondary" }}>
          {`Notesnook ${state.version} (${
            state.online ? "online" : "offline"
          })`}
        </Text>
      ) : null}
      <Flex
        group="row"
        data-test-id="row"
        sx={{
          alignItems: "center",
          gap: 2,
          p: 2,
          width: 280,
          borderRadius: "default",
          bg: "background-secondary",
          ":hover": { bg: "hover" }
        }}
      >
        <Text sx={{ color: "paragraph", flex: 1 }}>Hover this row</Text>
        <Box
          data-test-id="row-action"
          sx={{
            width: 20,
            height: 20,
            borderRadius: "small",
            bg: "accent",
            opacity: 0,
            ":group-hover": { group: "row", style: { opacity: 1 } }
          }}
        />
      </Flex>
      <Button
        data-test-id="toggle-scheme"
        onClick={props.onToggleColorScheme}
        sx={{ px: 3, py: 2 }}
      >
        {`Switch to ${props.colorScheme === "dark" ? "light" : "dark"}`}
      </Button>
      <Input
        data-test-id="input"
        placeholder="Type here"
        value={text}
        onChange={(e) => (setText)(e.target.value)}
        sx={{ width: 280 }}
      />
      <Text data-test-id="echo" sx={{ color: "paragraph" }}>
        {text}
      </Text>
      <Flex sx={{ alignItems: "center", gap: 2 }}>
        <Flex data-test-id="outline-parent" sx={{ p: 2, bg: "background" }}>
          <Box
            data-test-id="outline-box"
            sx={{
              width: 20,
              height: 20,
              outlineColor: "accent",
              outlineWidth: 2
            }}
          />
        </Flex>
      </Flex>
      <Flex data-test-id="weights" sx={{ flexDirection: "column", gap: 1 }}>
        {[400, 500, 600, 700].map((weight) => (
          <Text
            key={weight}
            data-test-id={`weight-${weight}`}
            sx={{ fontSize: "md", fontWeight: weight, alignSelf: "flex-start" }}
          >
            Travel itinerary
          </Text>
        ))}
      </Flex>
      <Grid data-test-id="grid" columns={3} gap={1} sx={{ width: 280 }}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Box
            key={index}
            data-test-id={`grid-${index}`}
            sx={{ height: 20, bg: "accent" }}
          />
        ))}
      </Grid>
      <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
        <Flex
          data-test-id="fade-parent"
          sx={{ width: 40, height: 40, bg: "background" }}
        >
          <Box
            data-test-id="fade"
            sx={{
              width: 40,
              height: 40,
              bg: "accent",
              opacity: faded ? 1 : 0,
              transition: {
                property: "opacity",
                duration: 1000,
                easing: "linear"
              }
            }}
          />
        </Flex>
        <Button data-test-id="toggle-fade" onClick={() => setFaded((v) => !v)}>
          Fade
        </Button>
        <Flex
          data-test-id="spin-parent"
          sx={{ width: 40, height: 40, bg: "background" }}
        >
          {shown ? (
            <Box
              data-test-id="spin"
              sx={{
                width: 40,
                height: 40,
                bg: "accent",
                animation: {
                  keyframes: { from: { opacity: 0 }, to: { opacity: 1 } },
                  duration: 1000,
                  easing: "linear"
                }
              }}
            />
          ) : null}
        </Flex>
        <Button data-test-id="toggle-spin" onClick={() => setShown((v) => !v)}>
          Show
        </Button>
      </Flex>
      <Text data-test-id="renders" sx={{ color: "paragraph-secondary" }}>
        {`renders: ${renders.current}`}
      </Text>
    </Flex>
  );
}
