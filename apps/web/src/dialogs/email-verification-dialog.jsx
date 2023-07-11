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

import { useEffect } from "react";
import { Flex, Text } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { useStore as useUserStore } from "../stores/user-store";
import { db } from "../common/db";
import { useState } from "react";
import { useSessionState } from "../hooks/use-session-state";
import Accordion from "../components/accordion";
import { ThemeVariant } from "../components/theme-provider";

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
      onClose={() => props.onCancel(false)}
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
        disabled: isSending || !canSendAgain
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => props.onCancel(true),
        disabled: isSending
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Text
          as="span"
          variant="body"
          sx={{ borderRadius: "default", alignSelf: "stretch" }}
        >
          We have sent the email confirmation link at{" "}
          <Text as="b" sx={{ color: "accent" }}>
            {user.email}
          </Text>
          .
        </Text>
        <ThemeVariant variant="secondary">
          <Accordion
            title={"What do I do if I am not getting the email?"}
            sx={{ mt: 2, bg: "background", borderRadius: "default" }}
          >
            <Text variant={"body"} px={1} pb={1}>
              {`If you didn't get an email from us or the confirmation link isn't
            working,`}{" "}
              <b>please send us an email from your registered email address</b>{" "}
              and we will manually confirm your account.
            </Text>
          </Accordion>
        </ThemeVariant>
      </Flex>
    </Dialog>
  );
}
export default EmailVerificationDialog;
