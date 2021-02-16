import React from "react";
import { Flex, Button, Text } from "rebass";
import Dialog from "./dialog";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common";
import { useState } from "react";

function EmailVerificationDialog(props) {
  const user = useUserStore((store) => store.user);
  const [error, setError] = useState();
  const [isSending, setIsSending] = useState(false);
  const [canSendAgain, setCanSendAgain] = useState(true);
  if (!user) {
    props.onCancel();
    return null;
  }
  return (
    <Dialog
      isOpen={true}
      title={"Verify your email"}
      description={"Please check your inbox for the confirmation email."}
      onClose={props.onCancel}
      positiveButton={{
        text: "Done",
        onClick: props.onCancel,
        loading: isSending,
        disabled: isSending,
      }}
    >
      <Flex flexDirection="column" alignItems="flex-start">
        <Text
          as="span"
          variant="body"
          bg="shade"
          color="primary"
          p={1}
          alignSelf="stretch"
          sx={{ borderRadius: "default" }}
        >
          We have sent the email with the confirmation link to{" "}
          <b>{user.email}</b>.
        </Text>
        {canSendAgain && (
          <Button
            mt={2}
            variant="anchor"
            onClick={async () => {
              try {
                setIsSending(true);
                setCanSendAgain(false);
                setTimeout(() => setCanSendAgain(true), 60 * 1000);
                await db.user.sendVerificationEmail();
              } catch (e) {
                setError(e.message);
              } finally {
                setIsSending(false);
              }
            }}
          >
            Resend confirmation email
          </Button>
        )}
        <Text variant="error" mt={2} color={error ? "error" : "success"}>
          {isSending
            ? "Sending confirmation email. Please wait..."
            : !canSendAgain && !isSending
            ? "Confirmation email sent. You can resend the email after 1 minute in case you didn't receive it."
            : !!error
            ? error
            : ""}
        </Text>
      </Flex>
    </Dialog>
  );
}
export default EmailVerificationDialog;
