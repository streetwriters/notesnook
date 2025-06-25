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

import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Box, Flex, Link, Text } from "@theme-ui/components";
import { useEffect, useState } from "react";
import { db } from "../../../common/db";
import { TransactionStatus, Transaction } from "@notesnook/core";
import { Loading } from "../../../components/icons";

const TransactionStatusToText: Record<TransactionStatus, string> = {
  completed: "Completed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
  disputed: "Disputed"
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
                { id: "date", title: strings.date(), width: "20%" },
                { id: "orderId", title: strings.orderId(), width: "20%" },
                { id: "amount", title: strings.amount(), width: "20%" },
                { id: "status", title: strings.status(), width: "20%" },
                { id: "receipt", title: strings.receipt(), width: "20%" }
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
              <Box key={transaction.order_id} as="tr" sx={{ height: 30 }}>
                <Text as="td" variant="body">
                  {getFormattedDate(transaction.created_at, "date")}
                </Text>
                <Text as="td" variant="body">
                  {transaction.order_id}
                </Text>
                <Text as="td" variant="body">
                  {transaction.amount} {transaction.currency}
                </Text>
                <Text as="td" variant="body">
                  {strings.transactionStatusToText(transaction.status)}
                </Text>
                <Text as="td" variant="body">
                  <Link
                    href={transaction.receipt_url}
                    target="_blank"
                    rel="noreferer nofollow"
                    variant="text.subBody"
                    sx={{ color: "accent" }}
                  >
                    {strings.viewReceipt()}
                  </Link>
                </Text>
              </Box>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

{
  /* <Flex sx={{ flexDirection: "column", gap: 1, mt: 1 }}>
  <Flex
    key={transaction.order_id}
    sx={{
      justifyContent: "space-between",
      borderBottom: "1px solid var(--border)",
      ":last-of-type": { borderBottom: "none" },
      pb: 1
    }}
  >
    <Flex sx={{ flexDirection: "column" }}>
      <Text variant="subtitle">Order #{transaction.order_id}</Text>
     
    </Flex>
    <Flex sx={{ flexDirection: "column", alignItems: "end" }}>
      <Text variant="body">
        {transaction.amount} {transaction.currency}
      </Text>
     
    </Flex>
  </Flex>
</Flex> */
}
