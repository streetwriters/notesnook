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

import { PropsWithChildren, useEffect } from "react";
import { ErrorText } from "../error-text";
import { BaseThemeProvider } from "../theme-provider";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ErrorBoundary as RErrorBoundary,
  FallbackProps,
  useErrorBoundary
} from "react-error-boundary";
import { useKeyStore } from "../../interfaces/key-store";
import { isFeatureSupported } from "../../utils/feature-check";

export function GlobalErrorHandler(props: PropsWithChildren) {
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    function handleError(e: ErrorEvent) {
      const error = new Error(e.message);
      error.stack = `${e.filename}:${e.lineno}:${e.colno}`;
      showBoundary(e.error || error);
    }
    function handleUnhandledRejection(e: PromiseRejectionEvent) {
      showBoundary(e.reason);
    }
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("error", handleError);
    };
  }, [showBoundary]);

  return <>{props.children}</>;
}

export function ErrorBoundary(props: PropsWithChildren) {
  return (
    <RErrorBoundary FallbackComponent={ErrorComponent}>
      {props.children}
    </RErrorBoundary>
  );
}

export function ErrorComponent({ error, resetErrorBoundary }: FallbackProps) {
  const help = getErrorHelp({ error, resetErrorBoundary });

  return (
    <BaseThemeProvider
      onRender={() => document.getElementById("splash")?.remove()}
      sx={{
        height: "100%",
        bg: "background",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Flex
        sx={{
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          py: 5
        }}
      >
        <Flex
          sx={{
            width: ["95%", "50%"],
            flexDirection: "column"
          }}
        >
          <svg
            style={{
              borderRadius: "default",
              height: 60,
              width: 40,
              alignSelf: "start",
              marginBottom: 20
            }}
          >
            <use href="#full-logo" />
          </svg>
          <Text
            variant="heading"
            sx={{ borderBottom: "1px solid var(--border)", pb: 1 }}
          >
            Something went wrong
          </Text>
          <ErrorText error={error} />
          {help ? (
            <>
              <Text variant="subtitle" sx={{ mt: 2 }}>
                What went wrong?
              </Text>
              <Text variant="body">{help.explanation}</Text>
              <Text variant="subtitle" sx={{ mt: 1 }}>
                How to fix it?
              </Text>
              <Text variant="body">{help.action}</Text>
            </>
          ) : null}
          <Flex sx={{ gap: 1 }}>
            {help ? (
              <Button
                variant="error"
                sx={{ alignSelf: "start", px: 30, mt: 1 }}
                onClick={() =>
                  help.fix().catch((e) => {
                    console.error(e);
                    alert(errorToString(e));
                  })
                }
              >
                Fix it
              </Button>
            ) : (
              <Button
                variant="error"
                sx={{ alignSelf: "start", px: 30, mt: 1 }}
                onClick={() => window.location.reload()}
              >
                Reload app
              </Button>
            )}
            <>
              <Button
                variant="secondary"
                sx={{ alignSelf: "start", px: 30, mt: 1 }}
                onClick={async () => {
                  navigator.clipboard.writeText(errorToString(error));
                }}
              >
                Copy
              </Button>
              <Button
                variant="secondary"
                sx={{ alignSelf: "start", px: 30, mt: 1 }}
                onClick={async () => {
                  const { getDeviceInfo } = await import(
                    "../../dialogs/issue-dialog"
                  );
                  const mailto = new URL("mailto:support@streetwriters.co");
                  mailto.searchParams.set(
                    "body",
                    `${errorToString(error)}

---
Device information:

${getDeviceInfo()}`
                  );
                  window.open(mailto.toString(), "_blank");
                }}
              >
                Contact support
              </Button>
            </>
          </Flex>
        </Flex>
      </Flex>
    </BaseThemeProvider>
  );
}

function getErrorHelp(props: FallbackProps) {
  const { error, resetErrorBoundary } = props;
  const errorText = errorToString(error);
  if (
    errorText.includes("file is not a database") ||
    errorText.includes("unsupported file format") ||
    errorText.includes("null function or function signature mismatch") ||
    errorText.includes("malformed database schema") ||
    /table ".+?" already exists/.test(errorText) ||
    errorText.includes("corrupted migrations:")
  ) {
    return {
      explanation: `This error usually means the database file is either corrupt or it could not be decrypted.`,
      action:
        "This error can only be fixed by wiping & reseting the database. Beware that this will wipe all your data inside the database with no way to recover it later on. This WILL NOT change/affect/delete/wipe your data on the server but ONLY on this device.",
      fix: async () => {
        await resetDatabase();
        resetErrorBoundary();
      }
    };
  } else if (errorText.includes("Could not decrypt key.")) {
    return {
      explanation: `This error means the at rest encryption key could not be decrypted. This can be due to data corruption or implementation change.`,
      action:
        "This error can only be fixed by wiping & reseting the Key Store and the database. This WILL NOT change/affect/delete/wipe your data on the server but ONLY on this device.",
      fix: async () => {
        await resetDatabase();
        resetErrorBoundary();
      }
    };
  } else if (errorText.includes("database disk image is malformed")) {
    return {
      explanation: `This error usually means the search index is corrupted.`,
      action:
        "This error can be fixed by rebuilding the search index. This action won't result in any kind of data loss.",
      fix: async () => {
        const { db } = await import("../../common/db");
        await db.lookup.rebuild();
        resetErrorBoundary();
      }
    };
  }
}

function errorToString(error: unknown) {
  return error instanceof Error
    ? [error.message, error.stack || ""].join("\n")
    : typeof error === "string"
    ? error
    : JSON.stringify(error);
}

async function resetDatabase() {
  const { createDialect } = await import("../../common/sqlite");
  const multiTab = !!globalThis.SharedWorker && isFeatureSupported("opfs");
  await useKeyStore.getState().clear();
  const dialect = createDialect({
    name: "notesnook",
    encrypted: true,
    async: !isFeatureSupported("opfs"),
    multiTab
  });
  const driver = dialect.createDriver();
  await driver.delete();
}
