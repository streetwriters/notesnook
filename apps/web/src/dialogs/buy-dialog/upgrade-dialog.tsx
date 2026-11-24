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
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { FeatureCaption } from "./feature-caption";
import { getAllPlans, PERIOD_METADATA, PLAN_METADATA } from "./plans";
import { formatRecurringPeriodShort } from "./plan-list";
import { getCurrencySymbol } from "../../common/currencies";
import { useStore as useUserStore } from "../../stores/user-store";
import { ChangePlanDialog } from "./change-plan-dialog";
import {
  Bell,
  CheckIcon,
  Cloud,
  FileDoc,
  Icon,
  Loading,
  Notebook,
  Tag,
  Warning
} from "../../components/icons";
import { showToast } from "../../utils/toast";
import { hardNavigate } from "../../navigation";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import { strings } from "@notesnook/intl";

export type UpgradeDialogProps = {
  feature: FeatureResult<any>;
  onClose: () => void;
};

const FEATURE_ICONS: Partial<Record<FeatureId, Icon>> = {
  storage: Cloud,
  fileSize: FileDoc,
  notebooks: Notebook,
  tags: Tag,
  activeReminders: Bell
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
  const featureRows: (typeof features)[] = [];
  for (let i = 0; i < features.length; i += 2)
    featureRows.push(features.slice(i, i + 2));

  return (
    <BaseDialog
      testId="upgrade-dialog"
      isOpen={true}
      onClose={onClose}
      width={550}
      noScroll
      sx={{
        borderRadius: "radius3",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        // BaseDialog's empty header already provides the top padding
        pb: "spacing7"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing7",
          px: "spacing7",
          overflowY: "auto"
        }}
      >
        <Flex sx={{ flexDirection: "column", gap: "spacing6" }}>
          {feature.error ? (
            <Flex
              sx={{
                alignItems: "center",
                gap: "spacing3",
                px: "spacing4",
                py: "spacing3",
                bg: "background-error",
                borderRadius: "radius2"
              }}
            >
              <Warning size={16} color="icon-error" sx={{ flexShrink: 0 }} />
              <Text
                className="selectable"
                sx={{
                  fontSize: "sm",
                  fontWeight: 400,
                  lineHeight: 1,
                  color: "paragraph-error"
                }}
              >
                {feature.error}
              </Text>
            </Flex>
          ) : null}
          <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
            <Text
              data-test-id="dialog-title"
              sx={{
                fontSize: "lg",
                fontWeight: 600,
                lineHeight: 1.4,
                color: "heading"
              }}
            >
              {strings.unlockFeatureToday()}
            </Text>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 400,
                lineHeight: 1,
                color: "paragraph"
              }}
            >
              {strings.upgradePlanTo(metadata.title)}
            </Text>
          </Flex>
          <Flex
            sx={{
              flexDirection: "column",
              gap: "spacing6",
              p: "spacing7",
              bg: "background-secondary",
              borderRadius: "radius4"
            }}
          >
            <Flex
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Text
                sx={{
                  fontSize: "md",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "heading"
                }}
              >
                What’s included
              </Text>
              <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bg: "accent"
                  }}
                />
                <Text
                  sx={{
                    fontSize: "sm",
                    fontWeight: 600,
                    lineHeight: 1,
                    color: "accent"
                  }}
                >
                  {feature.availableOn === SubscriptionPlan.ESSENTIAL
                    ? strings.essentialPlan()
                    : feature.availableOn === SubscriptionPlan.BELIEVER
                    ? strings.believerPlan()
                    : strings.proPlan()}
                </Text>
              </Flex>
            </Flex>
            <Box sx={{ height: 1, bg: "separator" }} />
            {featureRows.map((row) => (
              <Flex
                key={row.map((f) => f.id).join()}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                {row.map((f) => {
                  const isCurrent = f.id === feature.id;
                  const FeatureIcon = isCurrent
                    ? CheckIcon
                    : FEATURE_ICONS[f.id as FeatureId] || CheckIcon;
                  const caption = f.availability[
                    planToAvailability(
                      feature.availableOn || SubscriptionPlan.PRO
                    )
                  ].caption as boolean | number | string;
                  return (
                    <Flex
                      key={f.id}
                      sx={{
                        flex: "1 0 0",
                        minWidth: 1,
                        alignItems: "flex-start",
                        gap: "spacing4"
                      }}
                    >
                      <FeatureIcon
                        size={15}
                        color={isCurrent ? "accent" : "icon"}
                        sx={{ flexShrink: 0 }}
                      />
                      <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
                        <Text
                          sx={{
                            fontSize: "xs",
                            fontWeight: 400,
                            lineHeight: 1,
                            color: isCurrent ? "accent" : "paragraph"
                          }}
                        >
                          {f.title}
                        </Text>
                        <Text
                          sx={{
                            fontSize: "sm",
                            fontWeight: 500,
                            lineHeight: 1,
                            color: isCurrent ? "accent" : "heading"
                          }}
                        >
                          {caption === "infinity" ? (
                            strings.unlimited()
                          ) : caption === true ? (
                            "Included"
                          ) : (
                            <FeatureCaption caption={caption} />
                          )}
                        </Text>
                      </Flex>
                    </Flex>
                  );
                })}
              </Flex>
            ))}
          </Flex>
          <Flex
            sx={{
              alignItems: "center",
              px: "spacing4",
              py: "spacing3",
              bg: "background-secondary",
              borderRadius: "radius2"
            }}
          >
            <Text sx={{ fontSize: "sm", fontWeight: 400, lineHeight: 1 }}>
              <Text as="span" sx={{ fontWeight: 500, color: "heading" }}>
                {strings.cancelAnytime()}
              </Text>{" "}
              <Text as="span" sx={{ color: "paragraph" }}>
                {strings.dayMoneyBackGuarantee(
                  PERIOD_METADATA.yearly.refundDays
                )}
              </Text>
            </Text>
          </Flex>
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
          {!subscription || subscription.plan === SubscriptionPlan.FREE ? (
            <>
              <Button
                variant="new_accent"
                disabled={!plan}
                sx={{
                  alignSelf: "stretch",
                  px: "spacing4",
                  py: "spacing5"
                }}
                onClick={() => {
                  if (!plan) return;
                  onClose();

                  if (
                    !subscription ||
                    subscription.plan === SubscriptionPlan.FREE
                  ) {
                    const url = new URLSearchParams({
                      plan: Buffer.from(JSON.stringify(plan)).toString("base64")
                    });
                    hardNavigate("/checkout", url.toString());
                  } else ChangePlanDialog.show({ selectedPlan: plan.id });
                }}
              >
                {plan ? (
                  strings.upgradeToPlan(
                    metadata.title,
                    `${getCurrencySymbol(plan.currency)}${
                      plan.price.gross
                    }${formatRecurringPeriodShort(plan.period)}`
                  )
                ) : (
                  <Loading size={16} color="accentForeground" />
                )}
              </Button>
              <Button
                variant="new_bordered"
                sx={{
                  alignSelf: "stretch",
                  px: "spacing4",
                  py: "spacing5",
                  // Figma draws this stroke inside the button
                  border: "none",
                  boxShadow: "inset 0 0 0 1px var(--border)"
                }}
                onClick={() => {
                  onClose();
                  hardNavigate("/plans");
                }}
              >
                {strings.compareAllPlans()}
              </Button>
            </>
          ) : (
            <Button
              variant="new_accent"
              disabled={!plan}
              sx={{
                alignSelf: "stretch",
                px: "spacing4",
                py: "spacing5"
              }}
              onClick={() => {
                if (
                  isUserSubscribed() &&
                  subscription?.provider !== SubscriptionProvider.PADDLE &&
                  subscription?.provider !== SubscriptionProvider.STREETWRITERS
                )
                  return showToast(
                    "error",
                    strings.onlyChangePlanFromOriginalPlatform()
                  );
                onClose();
                ChangePlanDialog.show({});
              }}
            >
              {plan ? (
                <>{strings.changePlan()}</>
              ) : (
                <Loading size={16} color="accentForeground" />
              )}
            </Button>
          )}
        </Flex>
      </Flex>
    </BaseDialog>
  );
});
