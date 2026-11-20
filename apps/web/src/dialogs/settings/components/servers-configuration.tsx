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

import { SettingsCard } from "../../../components/settings-ui";
import { SectionHeading } from "../../../components/settings-ui";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ArrowsClockwise,
  BookOpen,
  Icon,
  ShieldCheck,
  Warning
} from "../../../components/icons";
import Field from "../../../components/field";
import { useState } from "react";
import { HostId, HostIds, useStore } from "../../../stores/setting-store";
import { useStore as useUserStore } from "../../../stores/user-store";
import { TaskManager } from "../../../common/task-manager";
import { isServerCompatible } from "@notesnook/core";
import { strings } from "@notesnook/intl";

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
  icon: Icon;
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
    icon: ArrowsClockwise,
    example: "http://localhost:4326",
    description: strings.syncServerDesc(),
    versionEndpoint: "/version"
  },
  {
    id: "auth",
    host: "AUTH_HOST",
    title: strings.authServer(),
    icon: ShieldCheck,
    example: "http://localhost:5326",
    description: strings.authServerDesc(),
    versionEndpoint: "/version"
  },
  {
    id: "sse",
    host: "SSE_HOST",
    title: strings.sseServer(),
    icon: ShieldCheck,
    example: "http://localhost:7326",
    description: strings.sseServerDesc(),
    versionEndpoint: "/version"
  },
  {
    id: "monograph",
    host: "MONOGRAPH_HOST",
    title: strings.monographServer(),
    icon: BookOpen,
    example: "http://localhost:6326",
    description: strings.monographServerDesc(),
    versionEndpoint: "/api/version"
  }
];
function Banner(props: {
  message: string;
  variant: "error" | "success";
  testId?: string;
}) {
  const isError = props.variant === "error";
  return (
    <Flex
      data-test-id={props.testId}
      sx={{
        alignItems: "center",
        gap: "spacing3",
        p: "spacing3",
        bg: isError ? "background-error" : "shade",
        borderRadius: "radius1"
      }}
    >
      {isError ? (
        <Warning size={13} color="icon-error" sx={{ flexShrink: 0 }} />
      ) : null}
      <Text
        className="selectable"
        variant="body"
        sx={{
          fontSize: "xs",
          lineHeight: 1,
          whiteSpace: "pre-wrap",
          color: isError ? "paragraph-error" : "accent"
        }}
      >
        {props.message}
      </Text>
    </Flex>
  );
}

export function ServersConfiguration() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<boolean>();
  const [urls, setUrls] = useState<Partial<Record<HostId, string>>>(
    useStore.getState().serverUrls
  );
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing7", width: "100%" }}>
      <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
        {isLoggedIn ? (
          <Banner
            variant="error"
            message={strings.logoutToChangeServerUrls()}
          />
        ) : null}
        {SERVERS.map((server) => (
          <SettingsCard key={server.id} sx={{ opacity: isLoggedIn ? 0.5 : 1 }}>
            <Flex sx={{ gap: "spacing3", alignItems: "flex-start" }}>
              <Flex
                sx={{
                  width: 25,
                  height: 25,
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  bg: "background-secondary",
                  borderRadius: "radius1"
                }}
              >
                <server.icon size={13} />
              </Flex>
              <Flex sx={{ flexDirection: "column", gap: "spacing2" }}>
                <Text
                  variant="body"
                  sx={{
                    fontSize: "xs",
                    fontWeight: 400,
                    lineHeight: 1,
                    color: "heading"
                  }}
                >
                  {`${server.title} URL`}
                </Text>
                <Text
                  variant="body"
                  sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}
                >
                  {server.description}
                </Text>
              </Flex>
            </Flex>
            <Field
              disabled={isLoggedIn}
              aria-label={`${server.title} URL`}
              placeholder={`e.g. ${server.example}`}
              validate={(text) => URL.canParse(text)}
              defaultValue={urls[server.host]}
              sx={{ opacity: 1 }}
              styles={{
                input: {
                  height: 45,
                  py: "spacing6",
                  px: "spacing4",
                  fontSize: "sm",
                  borderRadius: "radius2"
                }
              }}
              onChange={(e) =>
                setUrls((s) => {
                  s[server.host] = e.target.value;
                  return s;
                })
              }
            />
          </SettingsCard>
        ))}
        {error ? <Banner variant="error" message={error} /> : null}
        {success === true ? (
          <Banner variant="success" message={strings.connectedToServer()} />
        ) : null}
      </Flex>
      <Flex sx={{ justifyContent: "flex-end", gap: "spacing4" }}>
        <Button
          disabled={isLoggedIn}
          variant="new_bordered"
          sx={{
            px: "spacing8",
            py: "spacing6",
            fontSize: "sm",
            fontWeight: 400
          }}
          onClick={async () => {
            if (isLoggedIn) return;
            useStore.getState().setServerUrls();
            await TaskManager.startTask({
              type: "modal",
              title: strings.appWillReloadIn(5),
              subtitle: strings.changesReflectOnStart(),
              action() {
                return new Promise((resolve) => {
                  setTimeout(() => {
                    window.location.reload();
                    resolve(undefined);
                  }, 5000);
                });
              }
            });
          }}
        >
          {strings.reset()}
        </Button>
        <Button
          disabled={isLoggedIn}
          variant="new_secondary"
          sx={{
            px: "spacing8",
            py: "spacing6",
            fontSize: "sm",
            fontWeight: 400,
            border: "none"
          }}
          onClick={async () => {
            setError(undefined);
            try {
              for (const host of HostIds) {
                const url = urls[host];
                const server = SERVERS.find((s) => s.host === host);
                if (!server) throw new Error(strings.serverNotFound(host));
                if (!url) throw new Error(strings.allServerUrlsRequired());
                const version = await fetch(`${url}${server.versionEndpoint}`)
                  .then((r) => r.json() as Promise<VersionResponse>)
                  .catch(() => undefined);
                if (!version)
                  throw new Error(strings.couldNotConnectTo(server.title));
                if (version.id !== server.id)
                  throw new Error(
                    strings.incorrectServerUrl(url, server.title)
                  );
                if (!isServerCompatible(version.version))
                  throw new Error(
                    strings.serverVersionMismatch(server.title, url)
                  );
              }
              setSuccess(true);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {strings.testConnection()}
        </Button>
        <Button
          variant="new_accent"
          sx={{
            px: "spacing8",
            py: "spacing6",
            fontSize: "sm",
            fontWeight: 400
          }}
          disabled={!success}
          onClick={async () => {
            if (!success || isLoggedIn) return;
            useStore.getState().setServerUrls(urls);
            await TaskManager.startTask({
              type: "modal",
              title: strings.appWillReloadIn(5),
              subtitle: strings.changesReflectOnStart(),
              action() {
                return new Promise((resolve) => {
                  setTimeout(() => {
                    window.location.reload();
                    resolve(undefined);
                  }, 5000);
                });
              }
            });
          }}
        >
          {strings.save()}
        </Button>
      </Flex>
    </Flex>
  );
}

export function ServersHeader() {
  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing6" }}>
      <SectionHeading sx={{ m: 0 }}>
        {strings.serversConfiguration()}
      </SectionHeading>
      <ServersConfiguration />
    </Flex>
  );
}
