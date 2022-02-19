import { useEffect, useMemo, useState } from "react";
import { Button, Flex, Text } from "rebass";
import { hardNavigate, useQueryParams } from "../navigation";
import Field from "../components/field";
import * as Icon from "../components/icons";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useCallback } from "react";
import { createBackup } from "../common";
import useDatabase from "../hooks/use-database";
import Loader from "../components/loader";
import Config from "../utils/config";
import AuthContainer from "../components/auth-container";

const INPUT_STYLES = {
  container: { mt: 2, width: 400 },
  label: { fontWeight: "normal" },
  input: {
    p: "12px",
    borderRadius: "default",
    bg: "background",
    boxShadow: "0px 0px 5px 0px #00000019",
  },
};

function useRecovery() {
  const [{ code, userId }] = useQueryParams();
  const [loading, setLoading] = useState({
    isLoading: true,
    message: "Authenticating. Please wait...",
  });

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

function useIsSessionExpired() {
  const isSessionExpired = Config.get("sessionExpired", false);
  return isSessionExpired;
}

function useAuthenticateUser({ code, userId, performAction }) {
  const [isAppLoaded] = useDatabase();
  useEffect(() => {
    if (!isAppLoaded) return;
    performAction({
      message: "Authenticating. Please wait...",
      error: "Failed to authenticate. Please try again.",
      onError: () => hardNavigate("/"),
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
  }, [code, userId, performAction, isAppLoaded]);
}

const steps = {
  recoveryOptions: RecoveryOptionsStep,
  recoveryKey: RecoveryKeyStep,
  oldPassword: OldPasswordStep,
  backupData: BackupDataStep,
  newPassword: NewPasswordStep,
  final: FinalStep,
};

function AccountRecovery() {
  const { code, userId, loading, performAction } = useRecovery();
  const [step, setStep] = useState("recoveryOptions");
  const Step = useMemo(() => steps[step], [step]);
  useAuthenticateUser({ code, userId, performAction });
  useEffect(() => {
    if (!code || !userId) return hardNavigate("/");
  }, [code, userId]);

  return (
    <AuthContainer>
      <Flex
        flex="1"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{ zIndex: 1 }}
      >
        {loading.isLoading ? (
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="400px"
          >
            <Loader title={loading.message} />
          </Flex>
        ) : (
          <>
            <Step
              performAction={performAction}
              onFinished={(next) => {
                setStep(next);
              }}
              onRestart={() => {
                setStep(0);
              }}
            />
          </>
        )}
      </Flex>
    </AuthContainer>
  );
}
export default AccountRecovery;

function Step({ testId, heading, children, subtitle }) {
  return (
    <Flex
      data-test-id={testId}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width={400}
      // bg="#fff"
      // sx={{
      //   border: "1px solid var(--border)",
      //   borderRadius: "dialog",
      //   boxShadow: "0px 0px 60px 10px #00000022",
      //   p: 30,
      // }}
    >
      <Flex flexDirection={"column"} mb={30}>
        <Text variant="heading" fontSize={32} textAlign="center">
          {heading}
        </Text>
        {subtitle && (
          <Text
            variant="body"
            fontSize={"title"}
            mt={1}
            textAlign="center"
            color="fontTertiary"
          >
            {subtitle}
          </Text>
        )}
      </Flex>
      {children}
    </Flex>
  );
}

const recoveryMethods = [
  {
    key: "recoveryKey",
    testId: "step-recovery-key",
    title: "Use recovery key",
    description:
      "Your data recovery key is basically a hashed version of your password (plus some random salt). It can be used to decrypt your data for re-encryption.",
  },
  {
    key: "oldPassword",
    testId: "step-old-password",
    title: "Use your old account password",
    description:
      "In some cases, you cannot login due to case sensitivity issues in your email address. This option can be used to recover your account. (This is very similar to changing your account password but without logging in).",
  },
];
function RecoveryOptionsStep({ onFinished }) {
  const isSessionExpired = useIsSessionExpired();

  if (isSessionExpired) {
    onFinished("newPassword");
    return null;
  }

  return (
    <Step
      heading="Choose a recovery option"
      testId={"step-recovery-options"}
      subtitle={"How do you want to recover your account?"}
    >
      <Flex flexDirection="column" width="100%">
        {recoveryMethods.map((method) => (
          <Button
            variant={"tool"}
            data-test-id={method.testId}
            key={method.key}
            onClick={() => onFinished(method.key)}
            sx={{
              mb: 4,
              p: "12px",
              boxShadow: "0px 0px 10px 0px #00000011",
              alignItems: "start",
              justifyContent: "start",
              textAlign: "start",
              bg: "background",
            }}
          >
            <Text variant={"subtitle"}>{method.title}</Text>
            <Text variant={"body"} color="fontTertiary">
              {method.description}
            </Text>
          </Button>
        ))}
      </Flex>
    </Step>
  );
}

function RecoveryKeyStep({ performAction, onFinished }) {
  const isSessionExpired = useIsSessionExpired();

  if (isSessionExpired) {
    onFinished();
    return null;
  }

  return (
    <RecoveryStep
      testId={"step-recovery-key"}
      onFinished={onFinished}
      backButtonText="Don't have a recovery key?"
      onSubmit={async (formData) => {
        var recoveryKey = formData.get("recovery_key");
        if (recoveryKey) {
          await performAction({
            message: "Downloading your data. This might take a bit.",
            error: "Invalid recovery key.",
            action: async function recoverData() {
              const user = await db.user.getUser();
              await db.storage.write(`_uk_@${user.email}@_k`, recoveryKey);
              await db.sync(true);
              onFinished("backupData");
            },
          });
        }
      }}
    >
      <Field
        data-test-id="recovery_key"
        id="recovery_key"
        name="recovery_key"
        label="Enter your recovery key"
        autoFocus
        required
        helpText="Your data recovery key will be used to decrypt your data"
        type="password"
        styles={INPUT_STYLES}
      />
    </RecoveryStep>
  );
}

function OldPasswordStep({ performAction, onFinished }) {
  return (
    <RecoveryStep
      testId={"step-old-password"}
      backButtonText="Don't remember old password?"
      onFinished={onFinished}
      onSubmit={async (formData) => {
        var oldPassword = formData.get("old_password");
        if (oldPassword) {
          await performAction({
            message: "Downloading your data. This might take a bit.",
            error: "Incorrect old password.",
            action: async function recoverData() {
              const { email, salt } = await db.user.getUser();
              await db.storage.deriveCryptoKey(`_uk_@${email}`, {
                password: oldPassword,
                salt,
              });
              await db.sync(true);
              onFinished("backupData");
            },
          });
        }
      }}
    >
      <Field
        data-test-id="old_password"
        id="old_password"
        name="old_password"
        label="Enter your old password"
        type="password"
        autoFocus
        required
        helpText="Your old account password will be used to decrypt your data."
        styles={INPUT_STYLES}
      />
    </RecoveryStep>
  );
}

function RecoveryStep({
  onSubmit,
  children,
  onFinished,
  testId,
  backButtonText,
}) {
  const isSessionExpired = useIsSessionExpired();

  if (isSessionExpired) {
    onFinished();
    return null;
  }

  return (
    <Step
      heading="Recover your account"
      testId={testId}
      subtitle={
        <Text
          color="warn"
          bg="background"
          p={2}
          mt={2}
          sx={{ borderRadius: "default" }}
        >
          <Text fontWeight={"bold"}>WARNING!</Text>
          <Text variant={"body"} color="warn">
            You'll be logged out from all your devices. If you have any unsynced
            data on any device, make sure to sync before continuing.
          </Text>
        </Text>
      }
    >
      <Flex
        flexDirection="column"
        as="form"
        width="100%"
        onSubmit={async (e) => {
          e.preventDefault();
          var formData = new FormData(e.target);
          onSubmit(formData);
        }}
      >
        {children}
        <Button
          data-test-id="step-prev"
          variant={"anchor"}
          type={"button"}
          alignSelf="end"
          color="text"
          mt={2}
          onClick={() => onFinished("recoveryOptions")}
        >
          {backButtonText}
        </Button>
        <Button
          data-test-id="step-next"
          display="flex"
          type="submit"
          mt={50}
          px={50}
          variant="primary"
          alignSelf={"center"}
          sx={{ borderRadius: 50 }}
          justifyContent="center"
          alignItems="center"
        >
          Next
        </Button>
      </Flex>
    </Step>
  );
}

function BackupDataStep({ performAction, onFinished }) {
  return (
    <Step
      heading="Backup your data"
      subtitle={"Please download a backup of your data before continuing."}
      testId={"step-backup-data"}
    >
      <Button
        data-test-id="step-next"
        alignSelf="center"
        display="flex"
        sx={{
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 50,
        }}
        px={30}
        onClick={async () => {
          await performAction({
            message: "Creating a backup...",
            error: "Could not create a backup.",
            onError: onFinished,
            action: async function downloadBackup() {
              await createBackup();
              onFinished("newPassword");
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

function NewPasswordStep({ performAction, onFinished, onRestart }) {
  const [error, setError] = useState(true);

  return (
    <Step
      heading="Set new password"
      action={{ type: "submit", text: "Next" }}
      testId={"step-new-password"}
    >
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
                onFinished("final");
              }
            },
          });
        }}
      >
        <Field
          data-test-id="new_password"
          id="new_password"
          name="new_password"
          type="password"
          label="Enter new password"
          autoComplete="new-password"
          validatePassword
          onError={setError}
          autoFocus
          required
          helpText="This will be your new account password — a strong memorable password is recommended."
          styles={INPUT_STYLES}
        />
        <Button
          data-test-id="step-next"
          display="flex"
          type="submit"
          mt={50}
          px={50}
          variant="primary"
          alignSelf={"center"}
          sx={{ borderRadius: 50 }}
          justifyContent="center"
          alignItems="center"
        >
          Next
        </Button>
      </Flex>
    </Step>
  );
}

function FinalStep() {
  const [key, setKey] = useState();
  const isSessionExpired = useIsSessionExpired();
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    (async () => {
      const { key } = await db.user.getEncryptionKey();
      setKey(key);
      if (!isSessionExpired) {
        await db.user.logout(true, "Password changed.");
        await db.user.clearSessions(true);
        setIsReady(true);
      }
    })();
  }, [isSessionExpired]);

  if (!isReady && !isSessionExpired)
    return <Loader title={"Finalizing. Please wait..."} />;
  return (
    <Step
      heading="Account password changed"
      subtitle={"Please save your new recovery key in a safe place"}
      testId={"step-finished"}
    >
      <Text
        bg="background"
        p={2}
        fontFamily="monospace"
        fontSize="body"
        sx={{ borderRadius: "default", overflowWrap: "anywhere" }}
        data-test-id="new-recovery-key"
      >
        {key}
      </Text>
      <Button
        data-test-id="step-finish"
        variant="secondary"
        onClick={() =>
          (window.location.href = isSessionExpired
            ? "/sessionexpired"
            : "/login")
        }
        display="flex"
        type="submit"
        mt={50}
        px={50}
        alignSelf={"center"}
        sx={{ borderRadius: 50 }}
        justifyContent="center"
        alignItems="center"
      >
        {isSessionExpired ? "Renew session" : "Login to your account"}
      </Button>
    </Step>
  );
}
