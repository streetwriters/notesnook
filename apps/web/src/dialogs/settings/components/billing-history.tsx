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

import { useEffect, useState } from "react";
import { Copy, Loading } from "../../../components/icons";
import { Box, Button, Link, Flex, Text } from "@theme-ui/components";
import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { db } from "../../../common/db";
import { TransactionStatus, Transaction } from "@notesnook/core";
import { writeToClipboard } from "../../../utils/clipboard";
import { showToast } from "../../../utils/toast";
import { TaskManager } from "../../../common/task-manager";

const TransactionStatusToText: Record<TransactionStatus, string> = {
  completed: "Completed",
  billed: "Billed",
  canceled: "Canceled",
  paid: "Paid",
  past_due: "Past due"
};

export function BillingHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    (async function () {
      try {
        setError(undefined);
        setIsLoading(true);

        const transactions = await db.subscriptions.transactions();
        if (!transactions) return;
        setTransactions(transactions);
      } catch (e) {
        if (e instanceof Error) setError(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {isLoading ? (
        <Loading sx={{ mt: 2 }} />
      ) : error ? (
        <Flex
          sx={{
            bg: "var(--background-error)",
            p: 1,
            borderRadius: "default"
          }}
        >
          <Text variant="error" sx={{ whiteSpace: "pre-wrap" }}>
            {error.message}
            <br />
            {error.stack}
          </Text>
        </Flex>
      ) : (
        <table
          style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
          cellPadding={0}
          cellSpacing={0}
        >
          <thead>
            <Box
              as="tr"
              sx={{
                height: 30,
                th: { borderBottom: "1px solid var(--separator)" }
              }}
            >
              {[
                { id: "id", title: "ID", width: "5%" },
                { id: "billedAt", title: "Billed at", width: "20%" },
                { id: "amount", title: strings.amount(), width: "20%" },
                { id: "status", title: strings.status(), width: "20%" },
                { id: "invoice", title: "Invoice", width: "20%" }
              ].map((column) =>
                !column.title ? (
                  <th key={column.id} />
                ) : (
                  <Box
                    as="th"
                    key={column.id}
                    sx={{
                      width: column.width,
                      px: 1,
                      mb: 2,
                      textAlign: "left"
                    }}
                  >
                    <Text
                      variant="body"
                      sx={{ textAlign: "left", fontWeight: "normal" }}
                    >
                      {column.title}
                    </Text>
                  </Box>
                )
              )}
            </Box>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <Box key={transaction.id} as="tr" sx={{ height: 30 }}>
                <Text as="td" variant="body">
                  <Copy
                    size={16}
                    onClick={() =>
                      writeToClipboard({ "text/plain": transaction.id })
                    }
                    sx={{ cursor: "pointer" }}
                  />
                </Text>
                <Text as="td" variant="body">
                  {getFormattedDate(transaction.billed_at, "date")}
                </Text>
                <Text as="td" variant="body">
                  {(transaction.details.totals.grand_total / 100).toFixed(2)}{" "}
                  {transaction.details.totals.currency_code}
                </Text>
                <Text as="td" variant="body">
                  {strings.transactionStatusToText(transaction.status)}
                </Text>
                <Text as="td" variant="body">
                  <Button
                    variant="anchor"
                    onClick={async () => {
                      const url = await TaskManager.startTask({
                        type: "modal",
                        title: "Getting invoice",
                        subtitle: "This might take a minute or two.",
                        action() {
                          return db.subscriptions.invoice(transaction.id);
                        }
                      });

                      if (!url || url instanceof Error)
                        return showToast(
                          "error",
                          url instanceof Error
                            ? `Failed to get invoice for this transaction: ${url.message}`
                            : "No invoice found for this transaction."
                        );
                      window.open(url, "_blank");
                    }}
                  >
                    Download
                  </Button>
                </Text>
              </Box>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
