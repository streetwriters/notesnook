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
  FeatureId,
  FeatureResult,
  getFeature,
  planToAvailability,
  usePromise
} from "@notesnook/common";
import { DialogManager } from "../../common/dialog-manager";
import BaseDialog from "../../components/dialog";
import { SubscriptionPlan, SubscriptionProvider } from "@notesnook/core";
import { Button, Flex, Text } from "@theme-ui/components";
import { FeatureCaption } from "./feature-caption";
import { getAllPlans, PERIOD_METADATA, PLAN_METADATA } from "./plans";
import { formatRecurringPeriodShort } from "./plan-list";
import { useCheckoutStore } from "./store";
import { BuyDialog } from "./buy-dialog";
import { ErrorText } from "../../components/error-text";
import { getCurrencySymbol } from "../../common/currencies";
import { useStore as useUserStore } from "../../stores/user-store";
import { ChangePlanDialog } from "./change-plan-dialog";
import { Loading } from "../../components/icons";
import { showToast } from "../../utils/toast";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";

export type UpgradeDialogProps = {
  feature: FeatureResult<any>;
  onClose: () => void;
};

export const UpgradeDialog = DialogManager.register(function UpgradeDialog(
  props: UpgradeDialogProps
) {
  const { onClose, feature } = props;
  const subscription = useUserStore((store) => store.user?.subscription);
  const plans = usePromise(() => getAllPlans(), []);
  const plan =
    plans.status === "fulfilled"
      ? plans.value?.find(
          (p) =>
            p.plan === (feature.availableOn || SubscriptionPlan.PRO) &&
            p.period === "yearly"
        )
      : null;
  const metadata = PLAN_METADATA[feature.availableOn || SubscriptionPlan.PRO];
  const features = [
    ...new Set<FeatureId>([
      "storage",
      "fileSize",
      feature.id,
      "notebooks",
      "tags",
      "activeReminders"
    ])
  ].map((id) => getFeature(id));

  return (
    <BaseDialog
      testId="upgrade-dialog"
      title={`Unlock this feature today`}
      description={`Upgrade to the ${metadata.title} plan to use this feature`}
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
            {metadata.title} plan
          </Text>
          {features.map((f) => {
            const caption =
              f.availability[
                planToAvailability(feature.availableOn || SubscriptionPlan.PRO)
              ].caption;
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
        {!subscription || subscription.plan === SubscriptionPlan.FREE ? (
          <>
            <Button
              variant="accent"
              disabled={!plan}
              onClick={() => {
                if (!plan) return;
                onClose();

                if (
                  !subscription ||
                  subscription.plan === SubscriptionPlan.FREE
                ) {
                  useCheckoutStore.getState().selectPlan(plan);
                  BuyDialog.show({});
                } else ChangePlanDialog.show({ selectedPlan: plan.id });
              }}
            >
              {plan ? (
                <>
                  Upgrade to {metadata.title} {getCurrencySymbol(plan.currency)}
                  {plan.price.gross}
                  {formatRecurringPeriodShort(plan.period)}
                </>
              ) : (
                <Loading size={16} color="accentForeground" />
              )}
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
          </>
        ) : (
          <Button
            variant="accent"
            disabled={!plan}
            onClick={() => {
              if (
                isUserSubscribed() &&
                subscription?.provider !== SubscriptionProvider.PADDLE &&
                subscription?.provider !== SubscriptionProvider.STREETWRITERS
              )
                return showToast(
                  "error",
                  `You can only change your plan from the platform you originally bought the subscription from.`
                );
              onClose();
              ChangePlanDialog.show({});
            }}
          >
            {plan ? (
              <>Change plan</>
            ) : (
              <Loading size={16} color="accentForeground" />
            )}
          </Button>
        )}
      </Flex>
    </BaseDialog>
  );
});
