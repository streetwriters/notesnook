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

import { Button, Flex, Text } from "@theme-ui/components";
import Field from "../../../components/field";
import { useState } from "react";
import { HostId, HostIds, useStore } from "../../../stores/setting-store";
import { useStore as useUserStore } from "../../../stores/user-store";
import { ErrorText } from "../../../components/error-text";
import { TaskManager } from "../../../common/task-manager";
import { isServerCompatible } from "@notesnook/core";

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
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<boolean>();
  const [urls, setUrls] = useState<Partial<Record<HostId, string>>>(
    useStore.getState().serverUrls
  );
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  return (
    <>
      {isLoggedIn ? (
        <ErrorText
          error="You must log out in order to change/reset server URLs."
          sx={{ mb: 2, mt: 0 }}
        />
      ) : null}
      <Flex sx={{ flexDirection: "column" }}>
        {SERVERS.map((server) => (
          <Field
            disabled={isLoggedIn}
            key={server.id}
            label={`${server.title} URL`}
            helpText={server.description}
            placeholder={`e.g. ${server.example}`}
            validate={(text) => URL.canParse(text)}
            defaultValue={urls[server.host]}
            onChange={(e) =>
              setUrls((s) => {
                s[server.host] = e.target.value;
                return s;
              })
            }
          />
        ))}
        <ErrorText error={error} />
        {success === true ? (
          <Text
            className="selectable"
            variant={"error"}
            ml={1}
            sx={{
              whiteSpace: "pre-wrap",
              bg: "shade",
              color: "accent",
              p: 1,
              mt: 2,
              borderRadius: "default"
            }}
          >
            Connected to all servers successfully.
          </Text>
        ) : null}
        <Flex sx={{ mt: 1, justifyContent: "end", gap: 1 }}>
          <Button
            variant="accent"
            disabled={!success}
            onClick={async () => {
              if (!success || isLoggedIn) return;
              useStore.getState().setServerUrls(urls);
              await TaskManager.startTask({
                type: "modal",
                title: "App will reload in 5 seconds",
                subtitle:
                  "Your changes have been saved and will be reflected after the app has refreshed.",
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
            Save
          </Button>
          <Button
            disabled={isLoggedIn}
            variant="secondary"
            onClick={async () => {
              setError(undefined);
              try {
                for (const host of HostIds) {
                  const url = urls[host];
                  const server = SERVERS.find((s) => s.host === host);
                  if (!server)
                    throw new Error(`Server with host ${host} not found.`);
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
                  if (!isServerCompatible(version.version))
                    throw new Error(
                      `The ${server.title} at ${url} is not compatible with this client.`
                    );
                }
                setSuccess(true);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Test connection
          </Button>
          <Button
            disabled={isLoggedIn}
            variant="errorSecondary"
            onClick={async () => {
              if (isLoggedIn) return;
              useStore.getState().setServerUrls();
              await TaskManager.startTask({
                type: "modal",
                title: "App will reload in 5 seconds",
                subtitle:
                  "Your changes have been saved and will be reflected after the app has refreshed.",
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
            Reset
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
