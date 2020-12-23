import React, { useEffect, useState } from "react";
import { Button, Flex, Text } from "rebass";
import { navigate, useQueryParams } from "raviger";
import ThemeProvider from "../components/theme-provider";
import Field from "../components/field";
import * as Icon from "../components/icons";
import { db } from "../common";
import { showToast } from "../utils/toast";
import { useCallback } from "react";

function AccountRecovery(props) {
  const [{ code, userId }] = useQueryParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState({ isLoading: false });

  const doWorkWithLoading = useCallback(
    async (message, workCallback, onError) => {
      try {
        setLoading({ isLoading: true, message });
        await workCallback();
      } catch (e) {
        console.error(e);
        showToast("error", e.message);
        if (onError) onError(e);
      } finally {
        setLoading({ isLoading: false });
      }
    },
    []
  );

  useEffect(() => {
    if (!code || !userId) {
      navigate("/");
      return;
    }
    // http://localhost:3000/accountRecovery?userId=5fe1895d1b0636cf87b5058ecode=CfDJ8J5/rfvIUAZBidvsDZpkZcvNxUm0K2dGODHceKrSC4GUrGxtS3ZG5G2l8T7m0dvx6otZZv7djtzKBOUls0yZsjehYq+uSe0hG72M+DAMtB9gQ6df28xWdh2fx7L7Fw7s5I9unuRGYjN/A31e0BT3ryt9rzS1NM9ATnju80l1NR0Te599i76lSPLaOpnbO8qUanOqGtoQwaOa+bEMjJRGDG5NH2DkuJEsuD7VGqgXB57s4LWNJL0MvNwm5y2WImuaoQ==
    (async function () {
      setLoading({ isLoading: true, message: "Authorizing. Please wait..." });
      doWorkWithLoading(
        "Authorizing. Please wait...",
        async () => {
          await db.init();
          if (!!(await db.user.tokenManager.getAccessToken())) {
            await db.user.fetchUser(false);
            setLoading({ isLoading: false });
            return;
          }
          await db.user.tokenManager.getAccessTokenFromAuthorizationCode(
            userId,
            code.replace(/ /gm, "+")
          );
          await db.user.fetchUser(false);
        },
        () => {
          navigate("/");
        }
      );
    })();
  }, [userId, code, doWorkWithLoading]);

  return (
    <ThemeProvider>
      <Flex
        flexDirection="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={2}
        >
          <Text variant="heading" color="primary">
            Notesnook
          </Text>
          <Text variant="heading" fontSize={24} mb={2} textAlign="center">
            {step === 3
              ? "Your account has been recovered!"
              : "Account Recovery"}
          </Text>
          {loading.isLoading ? (
            <Flex flexDirection="column">
              <Icon.Loading rotate />
              <Text variant="body">{loading.message}</Text>
            </Flex>
          ) : step === 3 ? (
            <Flex flexDirection="column">
              <Button variant="secondary">Return to Notesnook</Button>
            </Flex>
          ) : (
            <Flex
              flexDirection="column"
              as="form"
              width="100%"
              onSubmit={async (e) => {
                e.preventDefault();
                var formData = new FormData(e.target);

                var recoveryKey = formData.get("recovery_key");
                if (recoveryKey) {
                  const [key] = recoveryKey.split("\0");
                  await doWorkWithLoading(
                    "Downloading your data. This might take a bit.",
                    async () => {
                      const user = await db.user.getUser();
                      await db.context.write(`_uk_@${user.email}@_k`, key);
                      await db.sync(true, true);
                    }
                  );
                  setStep((s) => ++s);
                }
                var newPassword = formData.get("new_password");
                if (newPassword) {
                  await doWorkWithLoading(
                    "Resetting account password. Please wait...",
                    async () => {
                      if (await db.user.resetPassword(newPassword)) {
                        setStep((s) => ++s);
                      }
                    }
                  );
                }
              }}
            >
              {step === 1 ? (
                <Field
                  id="recovery_key"
                  name="recovery_key"
                  label="Recovery Key"
                  autoFocus
                  helpText="We'll use the recovery key to download & decrypt your data."
                />
              ) : (
                <Field
                  id="new_password"
                  name="new_password"
                  type="password"
                  label="New Password"
                  autoFocus
                  helpText="Enter new account password."
                />
              )}

              <Flex alignSelf="flex-end" mt={2}>
                {step === 1 && (
                  <Button
                    type="submit"
                    variant="secondary"
                    py={"7px"}
                    px={4}
                    alignSelf="flex-end"
                    mr={1}
                  >
                    I don't have it
                  </Button>
                )}
                <Button type="submit" py={"7px"} px={4}>
                  Next
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default AccountRecovery;
