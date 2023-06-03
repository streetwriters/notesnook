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
import { Perform } from "../../common/dialog-controller";
import Dialog from "./dialog";
import { db } from "../../common/db";
import { Loading } from "../icons";
import { Flex, Link, Text } from "@theme-ui/components";
import { getFormattedDate } from "../../utils/time";

type Transaction = {
  order_id: string;
  checkout_id: string;
  amount: string;
  currency: string;
  status: keyof typeof TransactionStatusToText;
  created_at: string;
  passthrough: null;
  product_id: number;
  is_subscription: boolean;
  is_one_off: boolean;
  subscription: Subscription;
  user: User;
  receipt_url: string;
};

type Subscription = {
  subscription_id: number;
  status: string;
};

type User = {
  user_id: number;
  email: string;
  marketing_consent: boolean;
};

const TransactionStatusToText = {
  completed: "Completed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
  disputed: "Disputed"
};

export type BillingHistoryDialogProps = {
  onClose: Perform;
};

export default function BillingHistoryDialog(props: BillingHistoryDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    (async function () {
      try {
        setError(undefined);
        setIsLoading(true);

        const transactions = await db.subscriptions?.transactions();
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
    <Dialog
      isOpen={true}
      title={"Billing history"}
      description={"View all the transactions you have made with Notesnook."}
      onClose={() => props.onClose(false)}
      negativeButton={{ text: "Close", onClick: () => props.onClose(false) }}
      width={600}
    >
      {isLoading ? (
        <Loading sx={{ mt: 2 }} />
      ) : error ? (
        <Flex sx={{ bg: "errorBg", p: 1, borderRadius: "default" }}>
          <Text variant="error">
            {error.message}
            <br />
            {error.stack}
          </Text>
        </Flex>
      ) : (
        <Flex sx={{ flexDirection: "column", gap: 1, mt: 1 }}>
          {transactions.map((transaction) => (
            <Flex
              key={transaction.order_id}
              sx={{
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
                pb: 1
              }}
            >
              <Flex sx={{ flexDirection: "column" }}>
                <Text variant="subtitle">Order #{transaction.order_id}</Text>
                <Text variant="body" sx={{ color: "fontTertiary" }}>
                  {getFormattedDate(transaction.created_at, "date")} •{" "}
                  {TransactionStatusToText[transaction.status]}
                </Text>
              </Flex>
              <Flex sx={{ flexDirection: "column", alignItems: "end" }}>
                <Text variant="body">
                  {transaction.amount} {transaction.currency}
                </Text>
                <Link
                  href={transaction.receipt_url}
                  target="_blank"
                  rel="noreferer nofollow"
                  variant="text.subBody"
                  sx={{ color: "primary" }}
                >
                  View receipt
                </Link>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </Dialog>
  );
}
