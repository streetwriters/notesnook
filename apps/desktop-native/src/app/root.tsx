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

import { useEffect, useState } from "react";
import { Flex, Text } from "@ui";
import { App } from "./app";
import { boot, type BootOptions } from "./boot";
import { Demo, type Status } from "./demo";

export type RootProps = BootOptions & {
  screen?: "app" | "demo";
  colorScheme: "light" | "dark";
  onToggleColorScheme: () => void;
};

export function Root(props: RootProps) {
  const { screen = "app", seed, resetConfig } = props;
  const [state, setState] = useState<Status>({ status: "loading" });

  useEffect(() => {
    boot({ seed, resetConfig })
      .then(setState)
      .catch((e: Error) => setState({ status: "error", message: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (screen === "demo") return <Demo state={state} {...props} />;
  if (state.status === "ready") return <App />;
  return (
    <Flex
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        bg: "background"
      }}
    >
      <Text testID="boot-state" sx={{ color: "paragraph" }}>
        {state.status === "error" ? `Error: ${state.message}` : "Loading"}
      </Text>
    </Flex>
  );
}
