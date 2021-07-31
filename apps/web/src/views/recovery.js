import React, { useEffect, useMemo, useState } from "react";
import { Button, Flex, Image, Text } from "rebass";
import { useQueryParams } from "../navigation";
import ThemeProvider from "../components/theme-provider";
import Field from "../components/field";
import * as Icon from "../components/icons";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useCallback } from "react";
import { showRecoveryKeyDialog } from "../common/dialog-controller";
import { createBackup } from "../common";
import Logo from "../assets/logo.svg";

function navigate(path) {
  window.location.href = path;
}

function useRecovery() {
  const [{ code, userId }] = useQueryParams();
  const [loading, setLoading] = useState({ isLoading: false });

  const performAction = useCallback(async function ({
    message,
    error,
    onError,
    action,
  }) {
    try {
      setLoading({ isLoading: true, message });
      await action();
    } catch (e) {
      console.error(e);
      showToast("error", `${error} Error: ${e.message || "unknown."}`);
      if (onError) await onError(e);
    } finally {
      setLoading({ isLoading: false });
    }
  },
  []);

  return { code, userId, loading, setLoading, performAction };
}

function useAuthenticateUser({ code, userId, performAction }) {
  useEffect(() => {
    performAction({
      message: "Authenticating. Please wait...",
      error: "Failed to authenticate. Please try again.",
      onError: () => navigate("/"),
      action: authenticateUser,
    });

    async function authenticateUser() {
      await db.init();

      // if we already have an access token
      const accessToken = await db.user.tokenManager.getAccessToken();
      if (!accessToken) {
        await db.user.tokenManager.getAccessTokenFromAuthorizationCode(
          userId,
          code.replace(/ /gm, "+")
        );
      }
      await db.user.fetchUser(true);
    }
  }, [code, userId, performAction]);
}

const steps = [RecoveryKeyStep, BackupDataStep, NewPasswordStep, FinalStep];

function AccountRecovery() {
  const { code, userId, loading, performAction } = useRecovery();
  const [step, setStep] = useState(0);
  const Step = useMemo(() => steps[step], [step]);
  useAuthenticateUser({ code, userId, performAction });
  useEffect(() => {
    if (!code || !userId) return navigate("/");
  }, [code, userId]);

  return (
    <ThemeProvider>
      <Flex
        flexDirection="column"
        bg="background"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Image src={Logo} height={30} mt={2} />
        <Text variant="title" textAlign="center">
          Notesnook
        </Text>
        <Flex
          flex="1"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          {loading.isLoading ? (
            <Flex flexDirection="column" mt={2}>
              <Icon.Loading rotate color="primary" />
              <Text variant="body" mt={2} fontSize={"title"}>
                {loading.message}
              </Text>
            </Flex>
          ) : (
            <>
              <Step
                performAction={performAction}
                onFinished={() => {
                  setStep((s) => ++s);
                }}
                onRestart={() => {
                  setStep(0);
                }}
              />
            </>
          )}
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default AccountRecovery;

function Step({ heading, children }) {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <Text variant="heading" fontSize={24} mb={25} textAlign="center">
        {heading}
      </Text>

      {children}
    </Flex>
  );
}

function BackupDataStep({ performAction, onFinished }) {
  return (
    <Step heading="Backup your data">
      <Text variant="title">Please download a backup of your data.</Text>
      <Button
        alignSelf="center"
        mt={2}
        display="flex"
        sx={{ justifyContent: "center", alignItems: "center" }}
        px={20}
        onClick={async () => {
          await performAction({
            message: "Creating a backup...",
            error: "Could not create a backup.",
            onError: onFinished,
            action: async function downloadBackup() {
              await createBackup();
              onFinished();
            },
          });
        }}
      >
        <Icon.ArrowDown sx={{ mr: 1 }} color="static" size={16} /> Download
        backup
      </Button>
    </Step>
  );
}

function RecoveryKeyStep({ performAction, onFinished }) {
  return (
    <Step
      heading="Recover your account"
      action={{ type: "submit", text: "Next" }}
    >
      <Flex
        flexDirection="column"
        as="form"
        width="100%"
        onSubmit={async (e) => {
          e.preventDefault();
          var formData = new FormData(e.target);

          var recoveryKey = formData.get("recovery_key");
          if (recoveryKey) {
            await performAction({
              message: "Downloading your data. This might take a bit.",
              error: "Invalid recovery key.",
              action: async function recoverData() {
                const user = await db.user.getUser();
                await db.context.write(`_uk_@${user.email}@_k`, recoveryKey);
                await db.sync(true);
                onFinished();
              },
            });
          }
        }}
      >
        <Field
          id="recovery_key"
          name="recovery_key"
          label="Enter your recovery key"
          autoFocus
          required
          helpText="We'll use the recovery key to download & decrypt your data."
        />

        <Button
          display="flex"
          sx={{ justifyContent: "center", alignItems: "center" }}
          alignSelf="flex-end"
          px={20}
          mt={2}
          type={"submit"}
        >
          Next <Icon.ArrowRight sx={{ ml: 1 }} color="static" size={16} />
        </Button>
      </Flex>
    </Step>
  );
}

function NewPasswordStep({ performAction, onFinished, onRestart }) {
  const [error, setError] = useState(true);

  return (
    <Step heading="New password" action={{ type: "submit", text: "Next" }}>
      <Flex
        flexDirection="column"
        as="form"
        width="100%"
        onSubmit={async (e) => {
          e.preventDefault();
          var formData = new FormData(e.target);

          var newPassword = formData.get("new_password");
          if (error) {
            showToast(
              "error",
              "Your password does not meet all requirements. Please try a different password."
            );
            return;
          }
          await performAction({
            message: "Resetting account password. Please wait...",
            error: "Invalid password.",
            onError: () => {},
            action: async function setNewPassword() {
              if (await db.user.resetPassword(newPassword)) {
                // verify
                await performAction({
                  message: "Verifying...",
                  error: "Verification failed. Please try again.",
                  onError: () => {},
                  action: async function verifyPassword() {
                    await db.context.write("lastSynced", 0);
                    await db.sync();
                  },
                });

                // tell user to recovery the new key
                await showRecoveryKeyDialog();

                await db.user.logout(true);
                onFinished();
              }
            },
          });
        }}
      >
        <Field
          id="new_password"
          name="new_password"
          type="password"
          label="New Password"
          autoComplete="new-password"
          validatePassword
          onError={setError}
          autoFocus
          required
          helpText="Enter new account password."
        />
        <Button
          display="flex"
          sx={{ justifyContent: "center", alignItems: "center" }}
          alignSelf="flex-end"
          px={20}
          mt={2}
          type={"submit"}
        >
          Next <Icon.ArrowRight sx={{ ml: 1 }} color="static" size={16} />
        </Button>
      </Flex>
    </Step>
  );
}

function FinalStep() {
  return (
    <Step heading="Account recovered!">
      <Button
        variant="secondary"
        onClick={() => (window.location.href = "/login")}
      >
        Login using new password
      </Button>
    </Step>
  );
}
