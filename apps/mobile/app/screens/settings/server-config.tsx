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

import { isServerCompatible } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { View } from "react-native";
import { presentDialog } from "../../components/dialog/functions";
import { Button } from "../../components/ui/button";
import Input from "../../components/ui/input";
import { Notice } from "../../components/ui/notice";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import { HostId, HostIds } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";

export const ServerIds = ["notesnook-sync", "auth", "sse"] as const;
export type ServerId = (typeof ServerIds)[number];
type Server = {
  id: ServerId;
  host: HostId;
  title: string;
  example: string;
  description: string;
};
type VersionResponse = {
  version: number;
  id: string;
  instance: string;
};
const SERVERS: Server[] = [
  {
    id: "notesnook-sync",
    host: "API_HOST",
    title: "Sync server",
    example: "http://localhost:4326",
    description: "Server used to sync your notes & other data between devices."
  },
  {
    id: "auth",
    host: "AUTH_HOST",
    title: "Auth server",
    example: "http://localhost:5326",
    description: "Server used for login/sign up and authentication."
  },
  {
    id: "sse",
    host: "SSE_HOST",
    title: "Events server",
    example: "http://localhost:7326",
    description: "Server used to receive important notifications & events."
  }
];
export function ServersConfiguration() {
  const { colors } = useThemeColors();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<boolean>();
  const [urls, setUrls] = useState<Partial<Record<HostId, string>>>(
    SettingsService.getProperty("serverUrls") || {}
  );
  const isLoggedIn = useUserStore((state) => !!state.user);

  return (
    <View
      style={{
        paddingHorizontal: 12,
        gap: 12,
        marginTop: 12
      }}
    >
      {isLoggedIn ? (
        <Notice
          text="You must log out in order to change/reset server URLs."
          type="alert"
        />
      ) : null}
      <View style={{ flexDirection: "column" }}>
        {SERVERS.map((server) => (
          <Input
            key={server.id}
            editable={!isLoggedIn}
            placeholder={`${server.id} e.g. ${server.example}`}
            validationType="url"
            defaultValue={urls[server.host]}
            errorMessage="Please enter a valid URL."
            onChangeText={(value) =>
              setUrls((s) => {
                s[server.host] = value;
                return s;
              })
            }
          />
        ))}

        {error ? (
          <Paragraph
            style={{
              paddingVertical: 12
            }}
            color={colors.error.paragraph}
          >
            {error}
          </Paragraph>
        ) : null}

        {success === true ? (
          <Paragraph
            style={{
              paddingVertical: 12
            }}
            color={colors.success.paragraph}
          >
            Connected to all servers sucessfully.
          </Paragraph>
        ) : null}
        <View style={{ marginTop: 1, justifyContent: "flex-end", gap: 12 }}>
          <Button
            type="accent"
            disabled={!success}
            width="100%"
            onPress={async () => {
              if (!success || isLoggedIn) return;
              SettingsService.setProperty(
                "serverUrls",
                urls as Record<HostId, string>
              );

              presentDialog({
                title: "Server url changed",
                paragraph: "Restart the app for changes to take effect.",
                negativeText: "Done"
              });
            }}
            title="Save"
          />

          <Button
            disabled={isLoggedIn}
            type="secondary"
            width="100%"
            onPress={async () => {
              setError(undefined);
              try {
                for (const host of HostIds) {
                  const url = urls[host];
                  const server = SERVERS.find((s) => s.host === host)!;
                  if (!url) throw new Error("All server urls are required.");
                  const version = await fetch(`${url}/version`)
                    .then((r) => r.json() as Promise<VersionResponse>)
                    .catch(() => undefined);
                  if (!version)
                    throw new Error(`Could not connect to ${server.title}.`);
                  if (version.id !== server.id)
                    throw new Error(
                      `The URL you have given (${url}) does not point to the ${server.title}.`
                    );
                  if (!isServerCompatible(version.version)) {
                    throw new Error(
                      `The server version is not compatible with the app.`
                    );
                  }
                }
                setSuccess(true);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
            title="Test connection"
          />

          <Button
            disabled={isLoggedIn}
            type="error"
            width="100%"
            title="Reset"
            onPress={async () => {
              if (isLoggedIn) return;
              SettingsService.setProperty("serverUrls", undefined);
              presentDialog({
                title: "Server urls reset",
                paragraph: "Restart the app for changes to take effect.",
                negativeText: "Done"
              });
            }}
          />
        </View>
      </View>
    </View>
  );
}
