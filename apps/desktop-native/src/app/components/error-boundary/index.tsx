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

import { Component, type ErrorInfo, type ReactNode } from "react";
import { strings } from "@notesnook/intl";
import { databaseHost, shell } from "@platform";
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { Logo } from "../navigation-menu/logo";
import { ErrorText } from "../error-text";
import { db } from "../../common/db";
import { useKeyStore } from "../../interfaces/key-store";
import { getDeviceInfo } from "../../utils/platform";
import { writeToClipboard } from "../../utils/clipboard";

export type FallbackProps = {
  error: unknown;
  resetErrorBoundary: () => void;
};

export function GlobalErrorHandler(props: { children?: ReactNode }) {
  return <>{props.children}</>;
}

type ErrorBoundaryState = { error: unknown; hasError: boolean };

export class ErrorBoundary extends Component<
  { children?: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: undefined, hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  reset = () => this.setState({ error: undefined, hasError: false });

  render() {
    if (this.state.hasError)
      return (
        <ErrorComponent
          error={this.state.error}
          resetErrorBoundary={this.reset}
        />
      );
    return this.props.children;
  }
}

export function ErrorComponent({ error, resetErrorBoundary }: FallbackProps) {
  const help = getErrorHelp({ error, resetErrorBoundary });

  return (
    <Flex sx={{ flex: 1, bg: "background", flexDirection: "column" }}>
      <ScrollContainer>
        <Flex
          sx={{
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            py: 5
          }}
        >
          <Flex sx={{ width: ["95%", "50%"], flexDirection: "column" }}>
            <Logo size={60} />
            <Text
              variant="heading"
              sx={{
                borderBottom: "1px solid",
                borderBottomColor: "border",
                pb: 1
              }}
            >
              {strings.somethingWentWrong()}
            </Text>
            <ErrorText error={errorToError(error)} />
            {help ? (
              <>
                <Text variant="subtitle" sx={{ mt: 2 }}>
                  {strings.whatWentWrong()}
                </Text>
                <Text variant="body">{help.explanation}</Text>
                <Text variant="subtitle" sx={{ mt: 1 }}>
                  {strings.howToFix()}
                </Text>
                <Text variant="body">{help.action}</Text>
              </>
            ) : null}
            <Flex sx={{ flexDirection: "row", gap: 1 }}>
              {help ? (
                <Button
                  variant="error"
                  sx={{ alignSelf: "flex-start", px: 30, mt: 1 }}
                  onPress={() =>
                    help.fix().catch((e) => {
                      console.error(e);
                    })
                  }
                >
                  <Text>{strings.fixIt()}</Text>
                </Button>
              ) : (
                <Button
                  variant="error"
                  sx={{ alignSelf: "flex-start", px: 30, mt: 1 }}
                  onPress={resetErrorBoundary}
                >
                  <Text>{strings.reloadApp()}</Text>
                </Button>
              )}
              <Button
                variant="secondary"
                sx={{ alignSelf: "flex-start", px: 30, mt: 1 }}
                onPress={async () => {
                  await writeToClipboard({
                    "text/plain": errorToString(error)
                  });
                }}
              >
                <Text>{strings.copy()}</Text>
              </Button>
              <Button
                variant="secondary"
                sx={{ alignSelf: "flex-start", px: 30, mt: 1 }}
                onPress={async () => {
                  const body = encodeURIComponent(`${errorToString(error)}

---
Device information:

${getDeviceInfo()}`);
                  shell.openUrl(`mailto:support@streetwriters.co?body=${body}`);
                }}
              >
                <Text>{strings.contactSupport()}</Text>
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}

function errorToError(error: unknown) {
  return error instanceof Error ? error : errorToString(error);
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
    errorText.includes("corrupted migrations:") ||
    errorText.includes(
      "Error while decrypting the ciphertext provided to safeStorage.decryptString"
    )
  ) {
    return {
      explanation: strings.databaseCorruptExplain(),
      action: strings.databaseCorruptFix(),
      fix: async () => {
        await resetDatabase();
        resetErrorBoundary();
      }
    };
  } else if (errorText.includes("Could not decrypt key.")) {
    return {
      explanation: strings.decryptKeyErrorExplain(),
      action: strings.decryptKeyErrorFix(),
      fix: async () => {
        await resetDatabase();
        resetErrorBoundary();
      }
    };
  } else if (errorText.includes("database disk image is malformed")) {
    return {
      explanation: strings.searchIndexCorrupt(),
      action: strings.searchIndexCorruptFix(),
      fix: async () => {
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
  await useKeyStore.getState().clear();
  await databaseHost.delete();
}
