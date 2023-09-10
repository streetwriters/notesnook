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

import { Text, Flex, Box } from "@theme-ui/components";
import Dialog from "../components/dialog";
import {
  Sync,
  Notebook,
  Tag2,
  Attachment,
  Backup,
  Vault,
  PDF,
  Edit
} from "../components/icons";
import { showBuyDialog } from "../common/dialog-controller";

const features = [
  { icon: Sync, title: "Instant private sync" },
  { icon: Notebook, title: "Unlimited notebooks" },
  { icon: Tag2, title: "Unlimited tags" },
  { icon: Attachment, title: "Encrypted attachments" },
  { icon: Backup, title: "Encrypted backups" },
  { icon: Vault, title: "Secure private vault" },
  { icon: PDF, title: "Export to PDF" },
  { icon: Edit, title: "Rich text editor" }
];
// TODO create trial expiry coupon codes
const reminders = {
  trialexpired: {
    title: "Your free trial has expired",
    description: "But we have a special offer just for you!",
    offer: {
      title: (
        <>
          Subscribe now to{" "}
          <Text as="span" sx={{ fontWeight: "bold", color: "accent" }}>
            get 30% off
          </Text>
          *
        </>
      ),
      subtitle: "*Only for yearly plan"
    },
    features,
    // footer: (
    //   <Flex bg="bgSecondary" pb={2}  sx={{justifyContent: "center"}}>
    //     <Button variant="anchor"  sx={{color: "paragraph"}}>
    //       Can't decide yet? Extend your trial!
    //     </Button>
    //   </Flex>
    // ),
    cta: {
      title: "Subscribe now",
      action: () => {
        setTimeout(async () => {
          await showBuyDialog("yearly", "TRIAL2PRO");
        }, 0);
      }
    }
  },
  trialexpiring: {
    title: "Your free trial is ending soon",
    description: "But your privacy doesn't have to...",
    offer: {
      title: (
        <>
          Upgrade now to continue using all the pro features without
          interruption.
        </>
      )
    },
    features,
    cta: {
      title: "Upgrade now",
      action: () => {
        setTimeout(async () => {
          await showBuyDialog();
        }, 0);
      }
    }
  }
};

function ReminderDialog(props) {
  const { reminderKey } = props;
  const reminder = reminders[reminderKey];
  if (!reminder) return null;

  return (
    <Dialog
      isOpen={true}
      title={reminder.title}
      onClose={() => props.onClose(false)}
      showCloseButton
      description={reminder.description}
      alignment="center"
      positiveButton={{
        text: <Flex>{reminder.cta.title}</Flex>,
        onClick: async () => {
          if (reminder.cta.action) await reminder.cta.action();

          props.onClose(true);
        }
      }}
      footer={reminder.footer}
    >
      <Flex
        mt={2}
        sx={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflowY: "auto",
          overflow: "hidden"
        }}
      >
        {reminder.offer && (
          <>
            <Text
              variant="body"
              sx={{ fontSize: "title", textAlign: "center" }}
            >
              {reminder.offer.title}
            </Text>
            <Text variant="body" opacity="0.8" sx={{ textAlign: "center" }}>
              {reminder.offer.subtitle}
            </Text>
          </>
        )}
        {reminder.features && (
          <Box
            mt={2}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: 1,
              rowGap: 1
            }}
          >
            {reminder.features.map((feature) => (
              <Flex
                key={feature.title}
                p={1}
                sx={{
                  borderRadius: "default",
                  border: "1px solid var(--border)"
                }}
              >
                <feature.icon size={16} sx={{ alignSelf: "start" }} />
                <Text variant="body" ml={1}>
                  {feature.title}
                </Text>
              </Flex>
            ))}
          </Box>
        )}
      </Flex>
    </Dialog>
  );
}
export default ReminderDialog;
