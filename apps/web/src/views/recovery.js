import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, Image, Text } from "rebass";
import { hardNavigate, useQueryParams } from "../navigation";
import ThemeProvider from "../components/theme-provider";
import Field from "../components/field";
import * as Icon from "../components/icons";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useCallback } from "react";
import { createBackup } from "../common";
import Logo from "../assets/logo.svg";
import LogoDark from "../assets/logo-dark.svg";
import { useStore as useThemeStore } from "../stores/theme-store";
import useDatabase from "../hooks/use-database";
import Loader from "../components/loader";
import Config from "../utils/config";

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

const steps = [RecoveryKeyStep, BackupDataStep, NewPasswordStep, FinalStep];

function AccountRecovery() {
  const { code, userId, loading, performAction } = useRecovery();
  const [step, setStep] = useState(0);
  const Step = useMemo(() => steps[step], [step]);
  useAuthenticateUser({ code, userId, performAction });
  useEffect(() => {
    if (!code || !userId) return hardNavigate("/");
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
        <Box
          as="svg"
          version="1.1"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMinYMin slice"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
          }}
        >
          <path
            d="M0 336L29.2 316.2C58.3 296.3 116.7 256.7 174.8 267.5C233 278.3 291 339.7 349.2 361.3C407.3 383 465.7 365 523.8 359.5C582 354 640 361 698.2 346.5C756.3 332 814.7 296 872.8 267.2C931 238.3 989 216.7 1047.2 202.3C1105.3 188 1163.7 181 1221.8 202.7C1280 224.3 1338 274.7 1396.2 298C1454.3 321.3 1512.7 317.7 1570.8 332C1629 346.3 1687 378.7 1745.2 366.2C1803.3 353.7 1861.7 296.3 1890.8 267.7L1920 239L1920 0L1890.8 0C1861.7 0 1803.3 0 1745.2 0C1687 0 1629 0 1570.8 0C1512.7 0 1454.3 0 1396.2 0C1338 0 1280 0 1221.8 0C1163.7 0 1105.3 0 1047.2 0C989 0 931 0 872.8 0C814.7 0 756.3 0 698.2 0C640 0 582 0 523.8 0C465.7 0 407.3 0 349.2 0C291 0 233 0 174.8 0C116.7 0 58.3 0 29.2 0L0 0Z"
            fill="var(--dimPrimary)"
          ></path>
          <path
            d="M0 627L29.2 607.3C58.3 587.7 116.7 548.3 174.8 564.7C233 581 291 653 349.2 683.5C407.3 714 465.7 703 523.8 703C582 703 640 714 698.2 724.8C756.3 735.7 814.7 746.3 872.8 742.7C931 739 989 721 1047.2 670.7C1105.3 620.3 1163.7 537.7 1221.8 528.7C1280 519.7 1338 584.3 1396.2 623.8C1454.3 663.3 1512.7 677.7 1570.8 666.8C1629 656 1687 620 1745.2 602C1803.3 584 1861.7 584 1890.8 584L1920 584L1920 237L1890.8 265.7C1861.7 294.3 1803.3 351.7 1745.2 364.2C1687 376.7 1629 344.3 1570.8 330C1512.7 315.7 1454.3 319.3 1396.2 296C1338 272.7 1280 222.3 1221.8 200.7C1163.7 179 1105.3 186 1047.2 200.3C989 214.7 931 236.3 872.8 265.2C814.7 294 756.3 330 698.2 344.5C640 359 582 352 523.8 357.5C465.7 363 407.3 381 349.2 359.3C291 337.7 233 276.3 174.8 265.5C116.7 254.7 58.3 294.3 29.2 314.2L0 334Z"
            fill="var(--shade)"
          ></path>
          <path
            d="M0 735L29.2 731.5C58.3 728 116.7 721 174.8 739C233 757 291 800 349.2 832.3C407.3 864.7 465.7 886.3 523.8 886.3C582 886.3 640 864.7 698.2 859.3C756.3 854 814.7 865 872.8 870.5C931 876 989 876 1047.2 845.3C1105.3 814.7 1163.7 753.3 1221.8 729.8C1280 706.3 1338 720.7 1396.2 738.7C1454.3 756.7 1512.7 778.3 1570.8 789.2C1629 800 1687 800 1745.2 814.5C1803.3 829 1861.7 858 1890.8 872.5L1920 887L1920 582L1890.8 582C1861.7 582 1803.3 582 1745.2 600C1687 618 1629 654 1570.8 664.8C1512.7 675.7 1454.3 661.3 1396.2 621.8C1338 582.3 1280 517.7 1221.8 526.7C1163.7 535.7 1105.3 618.3 1047.2 668.7C989 719 931 737 872.8 740.7C814.7 744.3 756.3 733.7 698.2 722.8C640 712 582 701 523.8 701C465.7 701 407.3 712 349.2 681.5C291 651 233 579 174.8 562.7C116.7 546.3 58.3 585.7 29.2 605.3L0 625Z"
            fill="var(--textSelection)"
          ></path>
          <path
            d="M0 897L29.2 895.3C58.3 893.7 116.7 890.3 174.8 908.3C233 926.3 291 965.7 349.2 985.3C407.3 1005 465.7 1005 523.8 1003.3C582 1001.7 640 998.3 698.2 996.7C756.3 995 814.7 995 872.8 986C931 977 989 959 1047.2 939.2C1105.3 919.3 1163.7 897.7 1221.8 894C1280 890.3 1338 904.7 1396.2 911.8C1454.3 919 1512.7 919 1570.8 928C1629 937 1687 955 1745.2 960.3C1803.3 965.7 1861.7 958.3 1890.8 954.7L1920 951L1920 885L1890.8 870.5C1861.7 856 1803.3 827 1745.2 812.5C1687 798 1629 798 1570.8 787.2C1512.7 776.3 1454.3 754.7 1396.2 736.7C1338 718.7 1280 704.3 1221.8 727.8C1163.7 751.3 1105.3 812.7 1047.2 843.3C989 874 931 874 872.8 868.5C814.7 863 756.3 852 698.2 857.3C640 862.7 582 884.3 523.8 884.3C465.7 884.3 407.3 862.7 349.2 830.3C291 798 233 755 174.8 737C116.7 719 58.3 726 29.2 729.5L0 733Z"
            fill="var(--shade)"
          ></path>
          <path
            d="M0 1081L29.2 1081C58.3 1081 116.7 1081 174.8 1081C233 1081 291 1081 349.2 1081C407.3 1081 465.7 1081 523.8 1081C582 1081 640 1081 698.2 1081C756.3 1081 814.7 1081 872.8 1081C931 1081 989 1081 1047.2 1081C1105.3 1081 1163.7 1081 1221.8 1081C1280 1081 1338 1081 1396.2 1081C1454.3 1081 1512.7 1081 1570.8 1081C1629 1081 1687 1081 1745.2 1081C1803.3 1081 1861.7 1081 1890.8 1081L1920 1081L1920 949L1890.8 952.7C1861.7 956.3 1803.3 963.7 1745.2 958.3C1687 953 1629 935 1570.8 926C1512.7 917 1454.3 917 1396.2 909.8C1338 902.7 1280 888.3 1221.8 892C1163.7 895.7 1105.3 917.3 1047.2 937.2C989 957 931 975 872.8 984C814.7 993 756.3 993 698.2 994.7C640 996.3 582 999.7 523.8 1001.3C465.7 1003 407.3 1003 349.2 983.3C291 963.7 233 924.3 174.8 906.3C116.7 888.3 58.3 891.7 29.2 893.3L0 895Z"
            fill="var(--textSelection)"
          ></path>
        </Box>
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
              bg="#fff"
              width="400px"
              sx={{
                border: "1px solid var(--border)",
                borderRadius: "dialog",
                boxShadow: "0px 0px 60px 10px #00000022",
                p: 30,
              }}
            >
              <Loader title={loading.message} />
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

function Step({ testId, heading, children, subtitle }) {
  const theme = useThemeStore((store) => store.theme);

  return (
    <Flex
      data-test-id={testId}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bg="#fff"
      width={400}
      sx={{
        border: "1px solid var(--border)",
        borderRadius: "dialog",
        boxShadow: "0px 0px 60px 10px #00000022",
        p: 30,
      }}
    >
      <Image
        alignSelf="center"
        src={theme === "dark" ? LogoDark : Logo}
        width={50}
        mb={4}
      />
      <Flex flexDirection={"column"} mb={30}>
        <Text variant="heading" fontSize={24} textAlign="center">
          {heading}
        </Text>
        {subtitle && (
          <Text variant="body" mt={1} textAlign="center" color="fontTertiary">
            {subtitle}
          </Text>
        )}
      </Flex>
      {children}
    </Flex>
  );
}

function RecoveryKeyStep({ performAction, onFinished }) {
  const isSessionExpired = useIsSessionExpired();

  if (isSessionExpired) {
    onFinished();
    return null;
  }

  return (
    <Step
      heading="Recover your account"
      testId={"step-recovery-key"}
      subtitle={
        <Text variant={"error"} color="warn" bg="warnBg" p={1}>
          <b>WARNING!</b>
          <br />
          You'll be logged out from all your devices.{" "}
          <b>
            If you have any unsynced data on any device, make sure to sync
            before continuing.
          </b>
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

          var recoveryKey = formData.get("recovery_key");
          if (recoveryKey) {
            await performAction({
              message: "Downloading your data. This might take a bit.",
              error: "Invalid recovery key.",
              action: async function recoverData() {
                const user = await db.user.getUser();
                await db.storage.write(`_uk_@${user.email}@_k`, recoveryKey);
                await db.sync(true);
                onFinished();
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
          helpText="We'll use the recovery key to download & decrypt your data"
        />

        <Button
          data-test-id="step-next"
          display="flex"
          sx={{ justifyContent: "center", alignItems: "center" }}
          alignSelf="flex-end"
          px={20}
          mt={2}
          type={"submit"}
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
                onFinished();
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
          label="New Password"
          autoComplete="new-password"
          validatePassword
          onError={setError}
          autoFocus
          required
          helpText="Enter new account password"
        />
        <Button
          data-test-id="step-next"
          display="flex"
          sx={{ justifyContent: "center", alignItems: "center" }}
          alignSelf="flex-end"
          px={20}
          mt={2}
          type={"submit"}
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

  if (!isReady) return <Loader title={"Finalizing. Please wait..."} />;
  return (
    <Step
      heading="Account password changed"
      subtitle={"Please save your new recovery key in a safe place"}
      testId={"step-finished"}
    >
      <Text
        bg="bgSecondary"
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
        mt={2}
      >
        {isSessionExpired ? "Renew session" : "Login to your account"}
      </Button>
    </Step>
  );
}
