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

import { useState } from "react";
import { getFormattedDate, usePromise } from "@notesnook/common";
import { InboxItemsHistoryErrorContext } from "@notesnook/core";
import {
  Button,
  Dialog,
  dataColor,
  Flex,
  ScrollContainer,
  Text,
  useWindowSize
} from "@ui";
import { clipboard } from "@platform";
import { strings } from "@notesnook/intl";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { Check, Copy, Trash } from "../components/icons";
import { showToast } from "../utils/toast";
import { ConfirmDialog } from "./confirm";

type InboxHistoryDialogProps = BaseDialogProps<boolean>;

const getColumns = () => [
  { title: strings.dateSynced(), width: 160, flex: 0 },
  { title: strings.error(), width: 120, flex: 0 },
  { title: strings.description(), width: 0, flex: 1 },
  { title: strings.details(), width: 0, flex: 1 },
  { title: "", width: 40, flex: 0 }
];

type Chip = {
  bg: "background-error" | ReturnType<typeof dataColor>;
  color: "accent-error" | ReturnType<typeof dataColor>;
};
const ERROR_CHIP_STYLES: Record<string, Chip> = {
  "Decryption failed": { bg: "background-error", color: "accent-error" },
  "Invalid JSON": {
    bg: dataColor("#ff980026"),
    color: dataColor("#e65100")
  },
  "Validation failed": {
    bg: dataColor("#ffc10726"),
    color: dataColor("#8a6000")
  }
};

function chipFor(message: string): Chip {
  if (message === strings.decryptionFailed())
    return ERROR_CHIP_STYLES["Decryption failed"];
  if (message === strings.invalidJson())
    return ERROR_CHIP_STYLES["Invalid JSON"];
  if (message === strings.validationFailed())
    return ERROR_CHIP_STYLES["Validation failed"];
  return (
    ERROR_CHIP_STYLES[message] ?? {
      bg: "background-error",
      color: "accent-error"
    }
  );
}

function ErrorBadge({
  message
}: {
  message: InboxItemsHistoryErrorContext["message"] | undefined;
}) {
  if (!message) {
    return (
      <Text variant="body" sx={{ color: "paragraph-secondary" }}>
        {"—"}
      </Text>
    );
  }
  const style = chipFor(message);
  return (
    <Text
      sx={{
        bg: style.bg,
        color: style.color,
        borderRadius: "default",
        px: "6px",
        py: "2px",
        fontSize: 10,
        fontWeight: 600
      }}
    >
      {message}
    </Text>
  );
}

function DetailsCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    clipboard.write({ "text/plain": value });
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <Flex sx={{ position: "relative", flexDirection: "row", gap: 1 }}>
      <ScrollContainer sx={{ maxHeight: 100, flex: 1 }}>
        <Text
          selectable
          sx={{
            color: "paragraph",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}
        >
          {value}
        </Text>
      </ScrollContainer>
      <Button
        variant="icon"
        title={strings.copy()}
        onPress={handleCopy}
        sx={{ p: "2px" }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </Flex>
  );
}

function parseErrorContext(
  raw: string | undefined
): InboxItemsHistoryErrorContext | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InboxItemsHistoryErrorContext;
  } catch {
    return null;
  }
}

const dash = "—";

export const InboxHistoryDialog = DialogManager.register(
  function InboxHistoryDialog(props: InboxHistoryDialogProps) {
    const { height: windowHeight } = useWindowSize();
    const result = usePromise(() => db.inboxItemsHistory.failed.items());

    async function deleteItem(id: string) {
      await db.inboxItemsHistory.delete([id]);
      showToast("success", strings.itemDeleted());
      if (result.status !== "pending") {
        result.refresh();
      }
    }

    async function deleteAll() {
      const ok = await ConfirmDialog.show({
        title: strings.deleteAll(),
        subtitle: strings.deleteAllFailedItemsDesc(),
        positiveButtonText: strings.yes(),
        negativeButtonText: strings.no()
      });
      if (!ok) return;
      await db.inboxItemsHistory.deleteFailed();
      showToast("success", strings.allItemsDeleted());
      if (result.status !== "pending") {
        result.refresh();
      }
    }

    return (
      <Dialog
        isOpen={true}
        title={strings.failedInboxItems()}
        titleAction={
          result.status === "fulfilled" && result.value.length > 0 ? (
            <Button variant="errorSecondary" onPress={deleteAll}>
              <Text>{strings.deleteAll()}</Text>
            </Button>
          ) : undefined
        }
        onClose={() => props.onClose(false)}
        negativeButton={{
          text: strings.close(),
          onClick: () => props.onClose(false)
        }}
        noScroll
        width="80%"
      >
        {result.status === "pending" ? (
          <Text sx={{ p: 3 }}>{strings.loading()}</Text>
        ) : result.status === "rejected" ? (
          <Text sx={{ p: 3 }}>{strings.failed()}</Text>
        ) : result.value.length === 0 ? (
          <Text sx={{ p: 3 }}>{strings.noFailedInboxItems()}</Text>
        ) : (
          <ScrollContainer sx={{ maxHeight: windowHeight * 0.7 }}>
            <Flex sx={{ p: 2, flexDirection: "column" }}>
              <Flex sx={{ flexDirection: "row" }}>
                {getColumns().map((col, index) => (
                  <Flex
                    key={index}
                    sx={{
                      width: col.width || undefined,
                      flex: col.flex,
                      px: 2,
                      py: 1,
                      borderBottom: "1px solid",
                      borderBottomColor: "separator"
                    }}
                  >
                    <Text variant="subtitle">{col.title}</Text>
                  </Flex>
                ))}
              </Flex>
              {result.value.map((item) => {
                const ctx = parseErrorContext(item.errorContext);
                const { message, description, ...rest } =
                  ctx ??
                  ({} as Partial<InboxItemsHistoryErrorContext> &
                    Record<string, unknown>);
                const hasExtra = Object.keys(rest).length > 0;
                const columns = getColumns();
                const cell = (index: number) => ({
                  width: columns[index].width || undefined,
                  flex: columns[index].flex,
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid" as const,
                  borderBottomColor: "separator" as const
                });
                return (
                  <Flex key={item.id} sx={{ flexDirection: "row" }}>
                    <Flex sx={cell(0)}>
                      <Text variant="body">
                        {getFormattedDate(item.dateSynced)}
                      </Text>
                    </Flex>
                    <Flex sx={cell(1)}>
                      <ErrorBadge message={message} />
                    </Flex>
                    <Flex sx={cell(2)}>
                      <Text variant="body">
                        {(description as string) ?? dash}
                      </Text>
                    </Flex>
                    <Flex sx={cell(3)}>
                      {hasExtra ? (
                        <DetailsCell value={JSON.stringify(rest, null, 2)} />
                      ) : (
                        <Text
                          variant="body"
                          sx={{ color: "paragraph-secondary" }}
                        >
                          {dash}
                        </Text>
                      )}
                    </Flex>
                    <Flex sx={{ ...cell(4), alignItems: "center" }}>
                      <Button
                        variant="icon"
                        title={strings.delete()}
                        onPress={async () => {
                          const ok = await ConfirmDialog.show({
                            title: strings.deleteItem(),
                            subtitle: strings.areYouSure(),
                            positiveButtonText: strings.yes(),
                            negativeButtonText: strings.no()
                          });
                          if (!ok) return;
                          deleteItem(item.id);
                        }}
                        sx={{ p: "2px" }}
                      >
                        <Trash size={16} color="accent-error" />
                      </Button>
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </ScrollContainer>
        )}
      </Dialog>
    );
  }
);
