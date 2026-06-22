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
import { Box, Button, Text } from "@theme-ui/components";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import { Check, Copy, Trash } from "../components/icons";
import ScrollContainer, {
  FlexScrollContainer
} from "../components/scroll-container";
import { strings } from "@notesnook/intl";
import { writeText } from "clipboard-polyfill";
import { showToast } from "../utils/toast";

type InboxHistoryDialogProps = BaseDialogProps<boolean>;

const COLUMNS = [
  { title: strings.dateSynced(), width: "160px" },
  { title: strings.error(), width: "120px" },
  { title: strings.description(), width: "1fr" },
  { title: strings.details(), width: "1fr" },
  { title: "", width: "40px" }
];

const ERROR_CHIP_STYLES: Record<
  InboxItemsHistoryErrorContext["message"],
  { bg: string; color: string }
> = {
  "Decryption failed": { bg: "background-error", color: "accent-error" },
  "Invalid JSON": { bg: "rgba(255, 152, 0, 0.15)", color: "#e65100" },
  "Validation failed": { bg: "rgba(255, 193, 7, 0.15)", color: "#8a6000" }
};

function ErrorBadge({
  message
}: {
  message: InboxItemsHistoryErrorContext["message"] | undefined;
}) {
  if (!message) {
    return (
      <Text variant="body" sx={{ color: "paragraph-secondary" }}>
        —
      </Text>
    );
  }

  const style = ERROR_CHIP_STYLES[message] ?? {
    bg: "background-error",
    color: "accent-error"
  };
  return (
    <Text
      sx={{
        bg: style.bg,
        color: style.color,
        borderRadius: "default",
        px: "6px",
        py: "2px",
        fontSize: "0.65em",
        fontWeight: 600
      }}
    >
      {message}
    </Text>
  );
}

function DetailsCell({ value }: { value: string }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <Box
      sx={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ScrollContainer suppressScrollX style={{ maxHeight: 100 }}>
        <Box
          as="pre"
          sx={{
            m: 0,
            fontSize: "0.72em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}
        >
          {value}
        </Box>
      </ScrollContainer>
      {(hovered || copied) && (
        <Button
          variant="icon"
          title="Copy"
          onClick={handleCopy}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            p: "2px",
            bg: "background",
            color: copied ? "accent" : undefined
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </Button>
      )}
    </Box>
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

export const InboxHistoryDialog = DialogManager.register(
  function InboxHistoryDialog(props: InboxHistoryDialogProps) {
    const result = usePromise(() => db.inboxItemsHistory.failed.items());

    async function deleteItem(id: string) {
      await db.inboxItemsHistory.delete([id]);
      showToast("success", strings.itemDeleted());
      if (result.status !== "pending") {
        result.refresh();
      }
    }

    async function deleteAll() {
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
          result.status === "fulfilled" &&
          result.value.length > 0 && (
            <Button variant="errorSecondary" onClick={deleteAll}>
              {strings.deleteAll()}
            </Button>
          )
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
          <FlexScrollContainer style={{ maxHeight: "70vh" }}>
            <Box sx={{ p: 2 }}>
              <Box
                as="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  "th, td": {
                    px: 2,
                    py: 1,
                    textAlign: "left",
                    verticalAlign: "top",
                    borderBottom: "1px solid var(--separator)"
                  }
                }}
              >
                <Box as="thead">
                  <Box as="tr">
                    {COLUMNS.map((col) => (
                      <Box
                        key={col.title}
                        as="th"
                        sx={{ width: col.width, whiteSpace: "nowrap" }}
                      >
                        <Text variant="subtitle">{col.title}</Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {result.value.map((item) => {
                    const ctx = parseErrorContext(item.errorContext);
                    const { message, description, ...rest } =
                      ctx ??
                      ({} as Partial<InboxItemsHistoryErrorContext> &
                        Record<string, unknown>);
                    const hasExtra = Object.keys(rest).length > 0;
                    return (
                      <Box as="tr" key={item.id}>
                        <Box as="td">
                          <Text variant="body" sx={{ whiteSpace: "nowrap" }}>
                            {getFormattedDate(item.dateSynced)}
                          </Text>
                        </Box>
                        <Box as="td">
                          <ErrorBadge message={message} />
                        </Box>
                        <Box as="td">
                          <Text variant="body">
                            {(description as string) ?? "—"}
                          </Text>
                        </Box>
                        <Box as="td">
                          {hasExtra ? (
                            <DetailsCell
                              value={JSON.stringify(rest, null, 2)}
                            />
                          ) : (
                            <Text
                              variant="body"
                              sx={{ color: "paragraph-secondary" }}
                            >
                              —
                            </Text>
                          )}
                        </Box>
                        <Box as="td" sx={{ textAlign: "center" }}>
                          <Button
                            variant="icon"
                            title={strings.delete()}
                            onClick={() => deleteItem(item.id)}
                            sx={{ color: "accent-error", p: "2px" }}
                          >
                            <Trash size={16} />
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </FlexScrollContainer>
        )}
      </Dialog>
    );
  }
);
