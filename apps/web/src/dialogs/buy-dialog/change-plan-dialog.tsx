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

import { DialogManager } from "../../common/dialog-manager";
import BaseDialog from "../../components/dialog";
import { Flex, Text } from "@theme-ui/components";
import { getAllPlans, PERIOD_METADATA, PLAN_METADATA } from "./plans";
import { SelectComponent } from "../settings";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common/db";
import { useState } from "react";
import dayjs from "dayjs";
import { showToast } from "../../utils/toast";
import { usePromise } from "@notesnook/common";
import { ErrorText } from "../../components/error-text";
import { Loading } from "../../components/icons";
import { getCurrencySymbol } from "../../common/currencies";

export type ChangePlanDialogProps = {
  onClose: () => void;
};

export const ChangePlanDialog = DialogManager.register(
  function ChangePlanDialog(props: ChangePlanDialogProps) {
    const { onClose } = props;
    const plans = usePromise(() => getAllPlans(), []);
    const subscription = useUserStore((store) => store.user?.subscription);
    const [changeSummary, setChangeSummary] = useState<
      { title: string; amount: string }[]
    >([]);
    const [selectedPlan, setSelectedPlan] = useState<string>();
    const [loading, setLoading] = useState(false);

    return (
      <BaseDialog
        title={`Change plan`}
        isOpen={true}
        onClose={onClose}
        positiveButton={{
          text: "Confirm",
          disabled: !selectedPlan || loading,
          loading,
          onClick: async () => {
            if (!selectedPlan) return;
            setLoading(true);
            try {
              await db.subscriptions.change(selectedPlan);
              onClose();
            } catch (e) {
              showToast("error", (e as Error).message);
            } finally {
              setLoading(false);
            }
          }
        }}
        negativeButton={{
          text: "Cancel",
          onClick: onClose
        }}
      >
        {plans.status === "rejected" ? (
          <ErrorText error={plans.reason} />
        ) : (
          <Flex sx={{ flexDirection: "column" }}>
            <Flex
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Text variant="body">Select plan</Text>
              {plans.status === "pending" || !plans.value || !subscription ? (
                <Loading size={16} />
              ) : (
                <SelectComponent
                  options={plans.value.map((p) => ({
                    title:
                      PLAN_METADATA[p.plan].title +
                      ` (${PERIOD_METADATA[p.period].title})`,
                    value: p.id
                  }))}
                  selectedOption={() => selectedPlan || subscription.productId}
                  onSelectionChanged={async (id) => {
                    const plan = plans.value?.find((p) => p.id === id);
                    if (!plan) return;
                    setSelectedPlan(id);
                    setLoading(true);
                    setChangeSummary([]);
                    try {
                      const {
                        data: {
                          update_summary,
                          immediate_transaction,
                          recurring_transaction_details,
                          next_transaction,
                          currency_code: currencyCode,
                          billing_cycle
                        }
                      } = await db.subscriptions.preview(id);
                      const proration =
                        immediate_transaction.details.line_items.find(
                          (l: any) => !!l.proration
                        ).proration;
                      const planPrice = parseInt(update_summary.charge.amount);
                      const balance =
                        recurring_transaction_details.totals.total -
                        recurring_transaction_details.totals.balance +
                        update_summary.credit.amount * -1;
                      const charge = planPrice - balance;
                      const recurringTotal = parseInt(
                        recurring_transaction_details.totals.total
                      );
                      const summary: { title: string; amount: string }[] = [
                        {
                          title: "Plan price",
                          amount: formatPrice(planPrice, currencyCode)
                        },
                        {
                          title: "Balance from current subscription",
                          amount: formatPrice(balance, currencyCode)
                        }
                      ];
                      if (update_summary.result.action === "charge") {
                        summary.push(
                          {
                            title: "Charged today",
                            amount: formatPrice(charge, currencyCode)
                          },
                          {
                            title: `Charged ${dayjs(
                              next_transaction.billing_period.starts_at
                            ).format("YYYY-MM-DD")}`,
                            amount: formatPrice(recurringTotal, currencyCode)
                          }
                        );
                      } else {
                        const nextCharge = recurringTotal - charge;
                        summary.push({
                          title: "Charged today",
                          amount: formatPrice(0, currencyCode)
                        });
                        if (nextCharge > 0 && proration) {
                          summary.push({
                            title: `Charged ${dayjs(
                              proration.billing_period.ends_at
                            ).format("YYYY-MM-DD")}`,
                            amount: formatPrice(nextCharge, currencyCode)
                          });
                          summary.push({
                            title: `Charged ${dayjs(
                              proration.billing_period.ends_at
                            )
                              .add(1, billing_cycle.interval)
                              .format("YYYY-MM-DD")}`,
                            amount: formatPrice(planPrice, currencyCode)
                          });
                        } else {
                          const freeIntervals = Math.floor(charge / planPrice);
                          const amount =
                            planPrice - (charge - planPrice * freeIntervals);
                          const chargeStartDate = dayjs(
                            next_transaction.billing_period.starts_at
                          ).add(freeIntervals, billing_cycle.interval);
                          summary.push(
                            {
                              title: `Charged ${chargeStartDate.format(
                                "YYYY-MM-DD"
                              )}`,
                              amount: formatPrice(amount, currencyCode)
                            },
                            {
                              title: `Charged ${chargeStartDate
                                .add(1, billing_cycle.interval)
                                .format("YYYY-MM-DD")}`,
                              amount: formatPrice(planPrice, currencyCode)
                            }
                          );
                        }
                      }
                      setChangeSummary(summary);
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              )}
            </Flex>
            {changeSummary.length > 0 ? (
              <Flex sx={{ flexDirection: "column", gap: 1, mt: 1 }}>
                <Text variant="subtitle">Summary</Text>
                {changeSummary.map((item) => (
                  <Flex
                    key={item.title}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <Text variant="body">{item.title}</Text>
                    <Text variant="body" sx={{ color: "paragraph-secondary" }}>
                      {item.amount}
                    </Text>
                  </Flex>
                ))}
                <Text variant="subBody">
                  Note: These are estimated amounts. The real amounts could
                  differ slightly.
                </Text>
              </Flex>
            ) : null}
          </Flex>
        )}
      </BaseDialog>
    );
  }
);

function formatPrice(amount: string | number, currency: string) {
  return `${getCurrencySymbol(currency)}${
    (typeof amount === "string" ? parseInt(amount) : amount) / 100
  }`;
}
