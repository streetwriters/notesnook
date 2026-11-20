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

import { useState } from "react";
import { Flex, Text } from "@theme-ui/components";
import Dialog from "../../../components/dialog";
import { Checkbox } from "../../../components/checkbox";
import { BaseDialogProps, DialogManager } from "../../../common/dialog-manager";

// The chosen reason is only collected for the UI. It is not sent anywhere.
const CANCEL_REASONS = [
  "It’s too expensive",
  "I need more features",
  "Switching to another app",
  "Technical or performance issues",
  "Using Notesnook less often",
  "Other"
];

type CancelSubscriptionDialogProps = BaseDialogProps<boolean>;
export const CancelSubscriptionDialog = DialogManager.register(
  function CancelSubscriptionDialog({
    onClose
  }: CancelSubscriptionDialogProps) {
    const [reason, setReason] = useState<string>();

    return (
      <Dialog
        testId="cancel-subscription-dialog"
        isOpen={true}
        width={440}
        title="Help us improve"
        description="Before you cancel, we'd appreciate knowing what influenced your decision."
        onClose={() => onClose(false)}
        negativeButton={{ text: "Keep it", onClick: () => onClose(false) }}
        positiveButton={{
          text: "Cancel subscription",
          variant: "new_error",
          onClick: () => onClose(true)
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing2",
            mt: "spacing6",
            mb: "spacing7"
          }}
        >
          {CANCEL_REASONS.map((item) => {
            const checked = reason === item;
            const toggle = () => setReason(checked ? undefined : item);
            return (
              <Flex
                key={item}
                onClick={toggle}
                sx={{
                  alignItems: "center",
                  gap: "spacing3",
                  py: "spacing3",
                  borderRadius: "10px",
                  cursor: "pointer"
                }}
              >
                <Checkbox
                  checked={checked}
                  onToggle={toggle}
                  aria-label={item}
                  size={15}
                  checkboxUncheckedIconColor="icon-disabled"
                />
                <Text
                  variant="body"
                  sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}
                >
                  {item}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Dialog>
    );
  }
);
