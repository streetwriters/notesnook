import React from "react";
import { Flex, Button, Text } from "rebass";
import Dialog, { showDialog } from "./dialog";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common";
import { useState } from "react";

function EmailVerificationDialog(props) {
  const user = useUserStore((store) => store.user);
  const [error, setError] = useState();
  if (!user) {
    props.onCancel();
    return;
  }
  return (
    <Dialog
      isOpen={true}
      title={"Verify your email"}
      description={"Please check your inbox for the confirmation email."}
      onClose={props.onCancel}
      negativeButton={{ text: "Done", onClick: props.onCancel }}
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
        <Button
          mt={2}
          variant="anchor"
          onClick={async () => {
            try {
              await db.user.sendVerificationEmail();
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Resend confirmation email
        </Button>
        {error && (
          <Text variant="error" mt={2}>
            {error}
          </Text>
        )}
      </Flex>
    </Dialog>
  );
}

export function showEmailVerificationDialog() {
  return showDialog((perform) => (
    <EmailVerificationDialog onCancel={() => perform(false)} />
  ));
}
