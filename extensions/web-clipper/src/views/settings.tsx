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

import { Button, Flex, Input, Label, Text } from "@theme-ui/components";
import { Icons } from "../components/icons";
import { Icon } from "../components/icons/icon";
import { usePersistentState } from "../hooks/use-persistent-state";
import { useAppStore } from "../stores/app-store";
import type { Config } from "@notesnook/clipper/dist/types";

export const SETTINGS_KEY = "settings";
export const DEFAULT_SETTINGS: Config = {
  corsProxy: "https://cors.notesnook.com",
  images: true,
  inlineImages: true
};

export function Settings() {
  const navigate = useAppStore((s) => s.navigate);
  const [settings, saveSettings] = usePersistentState<Config>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  return (
    <Flex
      sx={{
        flexDirection: "column",
        p: 2,
        width: 320,
        backgroundColor: "background"
      }}
      as="form"
      onSubmit={async (e) => {
        e.preventDefault();

        const form = new FormData(e.target as HTMLFormElement);

        let corsProxy = form.get("corsProxy")?.toString();
        if (corsProxy) {
          const url = new URL(corsProxy);
          corsProxy = `${url.protocol}//${url.hostname}`;
        }

        await browser.permissions.request({
          origins: [`${corsProxy}/*`]
        });

        saveSettings({
          corsProxy
        });
      }}
    >
      <Flex sx={{ alignItems: "center" }}>
        <Icon
          path={Icons.back}
          onClick={() => {
            navigate("/");
          }}
          sx={{ mr: 2 }}
        />
        <Text variant="title">Settings</Text>
      </Flex>
      <Label variant="text.body" sx={{ flexDirection: "column", mt: 2 }}>
        Custom CORS Proxy:
        <Text variant="subBody">
          For clipping to work correctly, we have to bypass CORS. You can use
          this setting to <a href="navigate">configure your own proxy</a> &amp;
          protect your privacy.
        </Text>
        <Input
          id="corsProxy"
          name="corsProxy"
          type="url"
          defaultValue={settings?.corsProxy}
          placeholder="https://cors.notesnook.com"
          sx={{ p: 1, py: "7px", mt: 1 }}
        />
      </Label>
      <Button variant="accent" type="submit" sx={{ mt: 2 }}>
        Save
      </Button>
    </Flex>
  );
}
