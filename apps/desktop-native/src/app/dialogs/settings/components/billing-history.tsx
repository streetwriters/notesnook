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

import { Button, Flex, Text } from "@ui";
import { shell } from "@platform";
import { Copy, Loading } from "../../../components/icons";
import { getFormattedDate, usePromise } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { db } from "../../../common/db";
import { writeToClipboard } from "../../../utils/clipboard";
import { showToast } from "../../../utils/toast";
import { TaskManager } from "../../../common/task-manager";
import { ErrorText } from "../../../components/error-text";

type Column = { id: string; title: string; width: number };

function HeaderRow(props: { columns: Column[] }) {
  return (
    <Flex
      sx={{
        flexDirection: "row",
        height: 30,
        alignItems: "center",
        borderBottom: "1px solid",
        borderBottomColor: "separator"
      }}
    >
      {props.columns.map((column) => (
        <Flex key={column.id} sx={{ flex: column.width, px: 1 }}>
          <Text variant="body" sx={{ textAlign: "left", fontWeight: "normal" }}>
            {column.title}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}

function Cell(props: { flex: number; children: React.ReactNode }) {
  return (
    <Flex sx={{ flex: props.flex, px: 1, justifyContent: "center" }}>
      {props.children}
    </Flex>
  );
}

export function BillingHistory() {
  const transactions = usePromise(() => db.subscriptions.transactions(), []);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {transactions.status === "pending" ? (
        <Loading sx={{ mt: 2 }} />
      ) : transactions.status === "rejected" ? (
        <ErrorText error={transactions.reason as Error} />
      ) : transactions.value?.transactions.length === 0 ? (
        <Text variant="body" sx={{ mt: 2, color: "paragraph-secondary" }}>
          {strings.youHaveNotBeenBilledYet()}
        </Text>
      ) : transactions.value?.type === "v1" ? (
        <Flex sx={{ flexDirection: "column" }}>
          <HeaderRow
            columns={[
              { id: "date", title: strings.date(), width: 20 },
              { id: "orderId", title: strings.orderId(), width: 20 },
              { id: "amount", title: strings.amount(), width: 20 },
              { id: "status", title: strings.status(), width: 20 },
              { id: "receipt", title: strings.receipt(), width: 20 }
            ]}
          />
          {transactions.value?.transactions.map((transaction) => (
            <Flex
              key={transaction.order_id}
              sx={{ flexDirection: "row", height: 30, alignItems: "center" }}
            >
              <Cell flex={20}>
                <Text variant="body">
                  {getFormattedDate(transaction.created_at, "date")}
                </Text>
              </Cell>
              <Cell flex={20}>
                <Text variant="body">{transaction.order_id}</Text>
              </Cell>
              <Cell flex={20}>
                <Text variant="body">
                  {transaction.amount} {transaction.currency}
                </Text>
              </Cell>
              <Cell flex={20}>
                <Text variant="body">
                  {strings.transactionStatusToText(transaction.status)}
                </Text>
              </Cell>
              <Cell flex={20}>
                <Text
                  variant="subBody"
                  onPress={() => shell.openUrl(transaction.receipt_url)}
                  sx={{ color: "accent", cursor: "pointer" }}
                >
                  {strings.viewReceipt()}
                </Text>
              </Cell>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Flex sx={{ flexDirection: "column" }}>
          <HeaderRow
            columns={[
              { id: "id", title: "ID", width: 5 },
              { id: "billedAt", title: strings.billedAt(), width: 20 },
              { id: "amount", title: strings.amount(), width: 20 },
              { id: "status", title: strings.status(), width: 20 },
              { id: "invoice", title: strings.invoice(), width: 20 }
            ]}
          />
          {transactions.value?.transactions.map((transaction) => (
            <Flex
              key={transaction.id}
              sx={{ flexDirection: "row", height: 30, alignItems: "center" }}
            >
              <Cell flex={5}>
                <Copy
                  size={16}
                  onPress={() =>
                    writeToClipboard({ "text/plain": transaction.id })
                  }
                />
              </Cell>
              <Cell flex={20}>
                <Text variant="body">
                  {getFormattedDate(
                    transaction.billed_at || transaction.created_at,
                    "date"
                  )}
                </Text>
              </Cell>
              <Cell flex={20}>
                <Text variant="body">
                  {(transaction.details.totals.grand_total / 100).toFixed(2)}{" "}
                  {transaction.details.totals.currency_code}
                </Text>
              </Cell>
              <Cell flex={20}>
                <Text variant="body">
                  {strings.transactionStatusToText(transaction.status)}
                </Text>
              </Cell>
              <Cell flex={20}>
                <Button
                  variant="anchor"
                  onPress={async () => {
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
                          ? strings.failedToGetInvoiceForTransaction(
                              url.message
                            )
                          : strings.noInvoiceFoundForTransaction()
                      );
                    shell.openUrl(url);
                  }}
                >
                  <Text>{strings.network.download()}</Text>
                </Button>
              </Cell>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
