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

import { Text, Flex, Button } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { useStore as useUserStore } from "../stores/user-store";
import { getSubscriptionInfo } from "./settings/components/user-profile";
import { strings } from "@notesnook/intl";

type OnboardingDialogProps = BaseDialogProps<boolean>;
export const OnboardingDialog = DialogManager.register(
  function OnboardingDialog({ onClose }: OnboardingDialogProps) {
    const user = useUserStore((store) => store.user);
    const { title } = getSubscriptionInfo(user);

    return (
      <Dialog isOpen={true} width={500} onClose={() => onClose(false)}>
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto"
          }}
        >
          <Text variant={"heading"} mt={2}>
            {strings.welcomeToPlan(title + " plan")}
          </Text>
          <Text
            variant={"body"}
            sx={{
              textAlign: "center",
              maxWidth: "70%",
              color: "var(--paragraph-secondary)"
            }}
          >
            {strings.thankYouPrivacy()}
          </Text>
          <Button
            variant="accent"
            sx={{ borderRadius: 50, px: 30, mb: 4, mt: 4 }}
            onClick={() => onClose(false)}
          >
            {strings.continue()}
          </Button>
        </Flex>
      </Dialog>
    );
  }
);
