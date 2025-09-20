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

import {
  FeatureResult,
  getFeature,
  planToAvailability
} from "@notesnook/common";
import { DialogManager } from "../../common/dialog-manager";
import BaseDialog from "../../components/dialog";
import { SubscriptionPlan } from "@notesnook/core";
import { Button, Flex, Text } from "@theme-ui/components";
import { FeatureCaption } from "./feature-caption";
import { PERIOD_METADATA, PLAN_METADATA, usePlans } from "./plans";
import { formatRecurringPeriodShort } from "./plan-list";
import { useCheckoutStore } from "./store";
import { BuyDialog } from "./buy-dialog";
import { ErrorText } from "../../components/error-text";
import { getCurrencySymbol } from "../../common/currencies";

export type UpgradeDialogProps = {
  feature: FeatureResult<any>;
  onClose: () => void;
};

export const UpgradeDialog = DialogManager.register(function UpgradeDialog(
  props: UpgradeDialogProps
) {
  const { onClose, feature } = props;
  const { plans } = usePlans();
  const plan = plans.find(
    (p) =>
      (p.plan === feature.availableOn || SubscriptionPlan.PRO) &&
      p.period === "yearly"
  )!;
  const { title } = getFeature(feature.id);
  return (
    <BaseDialog
      title={`Unlock this feature today`}
      description={`Upgrade to the ${
        PLAN_METADATA[plan?.plan].title
      } plan to use this feature`}
      isOpen={true}
      onClose={onClose}
      textAlignment="center"
      sx={{ pb: 2 }}
    >
      <ErrorText error={feature.error} sx={{ alignItems: "center" }} />
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            mt: 1,
            gap: 1,
            bg: "background-secondary",
            borderRadius: "dialog",
            border: "1px solid var(--border)",
            p: 1,
            alignSelf: "stretch"
          }}
        >
          <Text variant="body" sx={{ fontWeight: "bold", color: "heading" }}>
            {PLAN_METADATA[plan?.plan].title} plan
          </Text>
          {[
            getFeature("storage"),
            getFeature("fileSize"),
            getFeature(feature.id),
            getFeature("notebooks"),
            getFeature("tags"),
            getFeature("activeReminders")
          ].map((f) => {
            const caption =
              f.availability[planToAvailability(plan.plan)].caption;
            return (
              <Flex key={f.id} sx={{ justifyContent: "space-between" }}>
                <Text
                  variant="body"
                  color={f.id === feature.id ? "accent" : "paragraph"}
                >
                  {f.title}
                </Text>
                <Text
                  variant="body"
                  sx={{
                    "& path": {
                      fill:
                        f.id === feature.id
                          ? "var(--accent) !important"
                          : "var(--paragraph-secondary) !important"
                    }
                  }}
                >
                  <FeatureCaption caption={caption} />
                </Text>
              </Flex>
            );
          })}
        </Flex>
        <Text variant="body">
          <strong>Cancel anytime.</strong> {PERIOD_METADATA.yearly.refundDays}
          -day money-back guarantee.
        </Text>
        <Button
          variant="accent"
          onClick={() => {
            onClose();
            useCheckoutStore.getState().selectPlan(plan);
            BuyDialog.show({});
          }}
        >
          Start your free trial {getCurrencySymbol(plan.currency)}
          {plan.price.gross}
          {formatRecurringPeriodShort(plan.period)}
        </Button>
        <Button
          variant="tertiary"
          onClick={() => {
            onClose();
            BuyDialog.show({});
          }}
        >
          Compare all plans
        </Button>
      </Flex>
    </BaseDialog>
  );
});
