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
import { PLAN_METADATA } from "./plans";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { ComparePlans, Footer, PlansList } from "./plan-list";
import { ConfirmDialog } from "../confirm";
import { TaskManager } from "../../common/task-manager";
import { strings } from "@notesnook/intl";

export type ChangePlanDialogProps = {
  onClose: () => void;
};

export const ChangePlanDialog = DialogManager.register(
  function ChangePlanDialog(props: ChangePlanDialogProps) {
    const { onClose } = props;
    const subscription = useUserStore((store) => store.user?.subscription);

    return (
      <BaseDialog
        isOpen={true}
        onClose={onClose}
        sx={{
          width: ["95%", "80%", "60%"],
          height: ["auto", "auto", "80vw"]
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            flex: 1,
            px: 25,
            justifyContent: "center"
          }}
        >
          <Flex sx={{ flexDirection: "column", alignSelf: "center" }}>
            <Text
              id="select-plan"
              variant="heading"
              sx={{ fontSize: 32, textAlign: "center" }}
            >
              {strings.changePlan()}
            </Text>
            <Text
              variant="title"
              mt={1}
              sx={{
                fontSize: "title",
                color: "heading-secondary",
                textAlign: "center"
              }}
            >
              {strings.onlyPayProratedAmount()}
            </Text>
          </Flex>
          <PlansList
            selectedPlan={subscription?.productId}
            loadAllPlans
            ignoreTrial
            onPlanSelected={async (plan) => {
              const result = await ConfirmDialog.show({
                title: strings.confirmPlanChange(),
                message: strings.planSwitchedConfirmation(
                  PLAN_METADATA[plan.plan].title
                ),
                positiveButtonText: strings.confirm(),
                negativeButtonText: strings.cancel()
              });
              if (result) {
                onClose();
                await TaskManager.startTask({
                  type: "modal",
                  title: strings.changingSubscriptionPlan(),
                  subtitle: strings.changingSubscriptionPlanWait(),
                  action: async () => {
                    try {
                      await db.subscriptions.change(plan.id);
                      showToast(
                        "success",
                        strings.subscriptionChangedSuccessfully()
                      );
                    } catch (e) {
                      showToast("error", (e as Error).message);
                    }
                  }
                });
              }
            }}
          />
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            flex: 1,
            px: "5%",
            mt: 50
          }}
        >
          <ComparePlans />
          <Footer />
        </Flex>
      </BaseDialog>
    );
  }
);
