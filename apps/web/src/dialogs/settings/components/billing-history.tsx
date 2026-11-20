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

import { Check, Copy, Loading } from "../../../components/icons";
import { Box, Flex, Text } from "@theme-ui/components";
import { getFormattedDate, usePromise } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { db } from "../../../common/db";
import { useCopyToClipboard } from "../../../hooks/use-copy-to-clipboard";
import { showToast } from "../../../utils/toast";
import { TaskManager } from "../../../common/task-manager";
import { ErrorText } from "../../../components/error-text";
import { buttonProps } from "../../../components/settings-ui";

function CopyIdIcon({ id }: { id: string }) {
  const { copied, copy } = useCopyToClipboard();
  const Icon = copied ? Check : Copy;
  return (
    <Flex
      {...buttonProps(() => copy(id))}
      aria-label={strings.copy()}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        size: 20,
        borderRadius: "3px",
        bg: "hover",
        cursor: "pointer",
        ":hover": { bg: "hover-secondary" }
      }}
    >
      <Icon size={15} />
    </Flex>
  );
}

const cellSx = {
  fontFamily: "body",
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  px: "spacing6",
  py: "spacing4",
  fontSize: "xs",
  lineHeight: 1,
  color: "paragraph"
} as const;

function Cell(props: { children?: React.ReactNode; color?: string }) {
  return (
    <Box sx={{ ...cellSx, ...(props.color ? { color: props.color } : {}) }}>
      {props.children}
    </Box>
  );
}

function HeadCell(props: { children: React.ReactNode }) {
  return <Box sx={{ ...cellSx, color: "heading" }}>{props.children}</Box>;
}

function DownloadLink(props: { onClick: () => void; children: string }) {
  return (
    <Text
      as="button"
      onClick={props.onClick}
      sx={{
        p: 0,
        border: "none",
        bg: "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "xs",
        lineHeight: 1,
        color: "accent",
        ":hover": { filter: "brightness(0.82)", textDecoration: "underline" }
      }}
    >
      {props.children}
    </Text>
  );
}

function Row(props: { index: number; children: React.ReactNode }) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: "radius2",
        borderTopRightRadius: "radius2",
        bg: props.index % 2 === 1 ? "background-secondary" : "transparent"
      }}
    >
      {props.children}
    </Flex>
  );
}

export function BillingHistory() {
  const transactions = usePromise(() => db.subscriptions.transactions(), []);

  if (transactions.status === "pending") return <Loading />;
  if (transactions.status === "rejected")
    return <ErrorText error={transactions.reason} />;

  const value = transactions.value;
  const isV1 = value?.type === "v1";
  const columns = isV1
    ? [
        strings.date(),
        strings.orderId(),
        strings.amount(),
        strings.status(),
        strings.receipt()
      ]
    : [
        "ID",
        strings.billedAt(),
        strings.amount(),
        strings.status(),
        strings.invoice()
      ];

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          borderTopLeftRadius: "radius2",
          borderTopRightRadius: "radius2",
          bg: "background-selected"
        }}
      >
        {columns.map((column) => (
          <HeadCell key={column}>{column}</HeadCell>
        ))}
      </Flex>
      {value?.transactions.length === 0 ? (
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "center",
            mt: "spacing7",
            py: "spacing11"
          }}
        >
          <Text
            variant="body"
            sx={{ fontSize: "xs", lineHeight: 1.3, color: "paragraph" }}
          >
            {strings.youHaveNotBeenBilledYet()}
          </Text>
        </Flex>
      ) : value?.type === "v1" ? (
        value.transactions.map((transaction, index) => (
          <Row key={transaction.order_id} index={index}>
            <Cell>{getFormattedDate(transaction.created_at, "date")}</Cell>
            <Cell>{transaction.order_id}</Cell>
            <Cell>
              {transaction.amount} {transaction.currency}
            </Cell>
            <Cell>{strings.transactionStatusToText(transaction.status)}</Cell>
            <Cell>
              <DownloadLink
                onClick={() =>
                  window.open(
                    transaction.receipt_url,
                    "_blank",
                    "noreferrer,noopener"
                  )
                }
              >
                {strings.viewReceipt()}
              </DownloadLink>
            </Cell>
          </Row>
        ))
      ) : (
        value?.transactions.map((transaction, index) => (
          <Row key={transaction.id} index={index}>
            <Cell>
              <CopyIdIcon id={transaction.id} />
            </Cell>
            <Cell>
              {getFormattedDate(
                transaction.billed_at || transaction.created_at,
                "date"
              )}
            </Cell>
            <Cell>
              {(transaction.details.totals.grand_total / 100).toFixed(2)}{" "}
              {transaction.details.totals.currency_code}
            </Cell>
            <Cell
              color={
                transaction.status === "canceled"
                  ? "paragraph-error"
                  : undefined
              }
            >
              {strings.transactionStatusToText(transaction.status)}
            </Cell>
            <Cell>
              <DownloadLink
                onClick={async () => {
                  const url = await TaskManager.startTask({
                    type: "modal",
                    title: strings.gettingInvoice(),
                    subtitle: strings.mightTakeMinuteOrTwo(),
                    action() {
                      return db.subscriptions.invoice(transaction.id);
                    }
                  });

                  if (!url || url instanceof Error)
                    return showToast(
                      "error",
                      url instanceof Error
                        ? strings.failedToGetInvoiceForTransaction(url.message)
                        : strings.noInvoiceFoundForTransaction()
                    );
                  window.open(url, "_blank");
                }}
              >
                {strings.network.download()}
              </DownloadLink>
            </Cell>
          </Row>
        ))
      )}
    </Flex>
  );
}
