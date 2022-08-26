import { Text, Flex, Box, Button } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { showBuyDialog } from "../../common/dialog-controller";

const features = [
  { icon: Icon.Sync, title: "Instant private sync" },
  { icon: Icon.Notebook, title: "Unlimited notebooks" },
  { icon: Icon.Tag2, title: "Unlimited tags" },
  { icon: Icon.Attachment, title: "Encrypted attachments" },
  { icon: Icon.Backup, title: "Encrypted backups" },
  { icon: Icon.Vault, title: "Secure private vault" },
  { icon: Icon.PDF, title: "Export to PDF" },
  { icon: Icon.Edit, title: "Rich text editor" }
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
          <Text as="span" fontWeight="bold" color="primary">
            get 30% off
          </Text>
          *
        </>
      ),
      subtitle: "*Only for yearly plan"
    },
    features,
    // footer: (
    //   <Flex bg="bgSecondary" pb={2} justifyContent="center">
    //     <Button variant="anchor" color="text">
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
      onClose={props.onClose}
      showClose
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
        flexDirection="column"
        overflowY="auto"
        justifyContent="center"
        alignItems="center"
        mt={2}
        overflow="hidden"
      >
        {reminder.offer && (
          <>
            <Text textAlign="center" variant="body" fontSize="title">
              {reminder.offer.title}
            </Text>
            <Text textAlign="center" variant="body" opacity="0.8">
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
