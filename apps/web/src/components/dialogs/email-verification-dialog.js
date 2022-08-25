import React, { useEffect } from "react";
import { Flex, Button, Text } from "rebass";
import Dialog from "./dialog";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common/db";
import { useState } from "react";
import { useSessionState } from "../../hooks/use-session-state";
import Accordion from "../accordion";

var interval = 0;
function EmailVerificationDialog(props) {
  const user = useUserStore((store) => store.user);
  const [isSending, setIsSending] = useState(false);
  const [canSendAgain, setCanSendAgain] = useSessionState("canSendAgain", true);
  const [resetTimer, setResetTimer] = useSessionState("resetTimer", 60);

  useEffect(() => {
    if (!canSendAgain) {
      interval = setInterval(() => {
        setResetTimer((s) => {
          --s;
          if (s <= 0) {
            setCanSendAgain(true);
            clearInterval(interval);
            return 60;
          }
          return s;
        });
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [canSendAgain, setResetTimer, setCanSendAgain]);

  if (!user) {
    props.onCancel();
    return null;
  }
  return (
    <Dialog
      isOpen={true}
      title={"Confirm your email"}
      description={
        "Check your spam folder if you haven't received an email yet."
      }
      onClose={props.onCancel}
      positiveButton={{
        text: canSendAgain || isSending ? "Resend" : `Resend (${resetTimer})`,
        onClick: async () => {
          setIsSending(true);
          try {
            await db.user.sendVerificationEmail();
            setCanSendAgain(false);
          } catch (e) {
            console.error(e);
          } finally {
            setIsSending(false);
          }
        },
        loading: isSending,
        disabled: isSending || !canSendAgain,
      }}
      negativeButton={{
        text: "Cancel",
        onClick: props.onCancel,
        disabled: isSending,
      }}
    >
      <Flex flexDirection="column">
        <Text
          as="span"
          variant="body"
          alignSelf="stretch"
          sx={{ borderRadius: "default" }}
        >
          We have sent the email confirmation link at{" "}
          <Text as="b" fontWeight="bold">
            {user.email}
          </Text>
          .
        </Text>
        <Accordion
          title={"What do I do if I am not getting the email?"}
          sx={{ mt: 2, bg: "bgSecondary", borderRadius: "default" }}
        >
          <Text variant={"body"} px={1} pb={1}>
            If you didn't get an email from us or the confirmation link isn't
            working,{" "}
            <b>please send us an email from your registered email address</b>{" "}
            and we will manually confirm your account.
          </Text>
        </Accordion>
      </Flex>
    </Dialog>
  );
}
export default EmailVerificationDialog;
