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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { View } from "react-native";
import { presentDialog } from "../../components/dialog/functions";
import { Button } from "../../components/ui/button";
import Input from "../../components/ui/input";
import { Notice } from "../../components/ui/notice";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { HostId, HostIds } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";

export const ServerIds = [
  "notesnook-sync",
  "auth",
  "sse",
  "monograph"
] as const;
export type ServerId = (typeof ServerIds)[number];
type Server = {
  id: ServerId;
  host: HostId;
  title: string;
  example: string;
  description: string;
  versionEndpoint: string;
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
    title: strings.syncServer(),
    example: "http://localhost:4326",
    description: strings.syncServerDesc(),
    versionEndpoint: "/version"
  },
  {
    id: "auth",
    host: "AUTH_HOST",
    title: strings.authServer(),
    example: "http://localhost:5326",
    description: strings.authServerDesc(),
    versionEndpoint: "/version"
  },
  {
    id: "sse",
    host: "SSE_HOST",
    title: strings.sseServer(),
    example: "http://localhost:7326",
    description: strings.sseServerDesc(),
    versionEndpoint: "/version"
  },
  {
    id: "monograph",
    host: "MONOGRAPH_HOST",
    title: strings.monographServer(),
    example: "http://localhost:6326",
    description: strings.monographServerDesc(),
    versionEndpoint: "/api/version"
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
        <Notice text={strings.logoutToChangeServerUrls()} type="alert" />
      ) : null}

      <View style={{ flexDirection: "column" }}>
        {SERVERS.map((server) => (
          <Input
            key={server.id}
            editable={!isLoggedIn}
            placeholder={`${server.id} e.g. ${server.example}`}
            validationType="url"
            defaultValue={urls[server.host]}
            errorMessage={strings.enterValidUrl()}
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
            {strings.connectedToServer()}
          </Paragraph>
        ) : null}
        <View style={{ marginTop: 1, justifyContent: "flex-end", gap: 12 }}>
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
                  if (!server) throw new Error(strings.serverNotFound(host));
                  if (!url) throw new Error(strings.allServerUrlsRequired());
                  const version = await fetch(`${url}${server.versionEndpoint}`)
                    .then((r) => r.json() as Promise<VersionResponse>)
                    .catch(() => undefined);
                  if (!version)
                    throw new Error(
                      `${strings.couldNotConnectTo(server.title)}`
                    );
                  if (version.id !== server.id)
                    throw new Error(
                      `${strings.incorrectServerUrl(url, server.title)}.`
                    );
                  if (!isServerCompatible(version.version)) {
                    throw new Error(
                      strings.serverVersionMismatch(server.title, url)
                    );
                  }
                }
                setSuccess(true);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
            title={strings.testConnection()}
          />

          <Button
            type="accent"
            disabled={isLoggedIn}
            width="100%"
            onPress={async () => {
              if (!success) {
                ToastManager.show({
                  heading: strings.testConnectionBeforeSave()
                });
                return;
              }
              SettingsService.setProperty(
                "serverUrls",
                urls as Record<HostId, string>
              );

              presentDialog({
                title: strings.serverUrlChanged(),
                paragraph: strings.restartAppToTakeEffect(),
                negativeText: strings.done()
              });
            }}
            title={strings.save()}
          />

          <Button
            disabled={isLoggedIn}
            type="error"
            width="100%"
            title={strings.resetServerUrls()}
            onPress={async () => {
              if (isLoggedIn) return;
              SettingsService.setProperty("serverUrls", undefined);
              presentDialog({
                title: strings.serverUrlsReset(),
                paragraph: strings.restartAppToTakeEffect(),
                negativeText: strings.done()
              });
            }}
          />
        </View>
      </View>
    </View>
  );
}
