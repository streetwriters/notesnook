import { useEffect, useState } from "react";
import { Box, Button, Flex, Image, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import { CheckCircle, Loading, Error } from "../components/icons";
import Field from "../components/field";
import { getQueryParams, hardNavigate, useQueryParams } from "../navigation";
import { store as userstore } from "../stores/user-store";
import { db } from "../common/db";
import Config from "../utils/config";
import useDatabase from "../hooks/use-database";
import Loader from "../components/loader";
import Logo from "../assets/logo.svg";
import LogoDark from "../assets/logo-dark.svg";
import { useStore as useThemeStore } from "../stores/theme-store";

const authTypes = {
  signup: {
    title: "Create an account",
    subtitle: {
      text: "Already have an account?",
      action: {
        text: "Log in",
        onClick: () => hardNavigate("/login", getQueryParams()),
      },
    },
    labels: { email: "Enter email", password: "Set password" },
    confirmPassword: true,
    autoComplete: { password: "new-password" },
    primaryAction: {
      text: "Create account",
    },
    secondaryAction: {
      text: "Continue without creating an account",
      onClick: () => {
        redirectToURL("/");
      },
    },
    loading: {
      title: "Creating your account",
      text: "Please wait while we finalize your account.",
    },
    agreementText: (
      <>
        By pressing "Create account" button, you agree to our{" "}
        <Text
          as="a"
          color="primary"
          target="_blank"
          rel="noreferrer"
          href="https://notesnook.com/tos"
        >
          Terms of Service
        </Text>{" "}
        &amp;{" "}
        <Text
          as="a"
          color="primary"
          rel="noreferrer"
          href="https://notesnook.com/privacy"
        >
          Privacy Policy
        </Text>
        .
      </>
    ),
    onSubmit: async (form, onError) => {
      if (form.password !== form.confirmPassword) {
        onError("Passwords do not match.");
        return;
      }
      return await userstore
        .signup(form)
        .then(() => {
          redirectToURL("/notes/#/welcome");
        })
        .catch((e) => onError(e.message));
    },
  },
  login: {
    title: "Welcome back!",
    subtitle: {
      text: "Don't have an account?",
      action: {
        text: "Sign up!",
        onClick: () => hardNavigate("/signup", getQueryParams()),
      },
    },
    autoComplete: { password: "current-password" },
    labels: {
      email: "Enter email",
      password: "Enter password",
    },
    primaryAction: {
      text: "Login to your account",
    },
    loading: {
      title: "Logging you in",
      text: "Please wait while you are authenticated.",
    },
    supportsPasswordRecovery: true,
    onSubmit: async (form, onError) => {
      return await userstore
        .login(form)
        .then(async () => {
          redirectToURL(form.redirect || "/");
        })
        .catch((e) => onError(e.message));
    },
  },
  // recover: {
  //   resetOnNavigate: false,
  //   title: "Recover your account",
  //   subtitle: {
  //     text: "Remember your password?",
  //     action: {
  //       text: "Log in",
  //       onClick: () => hardNavigate("/login", getQueryParams()),
  //     },
  //   },
  //   helpTexts: {
  //     email:
  //       "Enter your Notesnook account email so we can send you instructions on how to recover your account.",
  //   },
  //   labels: { email: "Email address" },
  //   primaryAction: {
  //     text: "Recover account",
  //     loadingText: "Sending recovery email...",
  //   },
  //   onSubmit: async (form, onError, onSuccess) => {
  //     return await db.user
  //       .recoverAccount(form.email.toLowerCase())
  //       .then(async () =>
  //         onSuccess("Recovery email sent. Please check your inbox (and spam).")
  //       )
  //       .catch((e) => onError(e.message));
  //   },
  // },
};

function Auth(props) {
  const { type } = props;
  const [{ redirect }] = useQueryParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const [success, setSuccess] = useState();
  const [isAppLoaded] = useDatabase();
  const [form, setForm] = useState({});

  const theme = useThemeStore((store) => store.theme);

  const data = authTypes[type];

  useEffect(() => {
    if (isSubmitting) {
      setError();
      setSuccess();
    }
  }, [isSubmitting]);

  useEffect(() => {
    if (!isAppLoaded) return;
    (async () => {
      const user = await db.user.getUser();
      if (!!user) redirectToURL("/");
    })();
  }, [isAppLoaded]);

  return (
    <ThemeProvider>
      <Flex
        sx={{ position: "relative", height: "100%" }}
        justifyContent="center"
        alignItems="center"
        bg="background"
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
          as="form"
          id="authForm"
          p={30}
          width="400px"
          flexDirection="column"
          justifyContent="center"
          alignItems="stretch"
          bg="background"
          mx={[2, 0, 0]}
          sx={{
            zIndex: 1,
            border: "1px solid var(--border)",
            borderRadius: "dialog",
            boxShadow: "0px 0px 60px 10px #00000022",
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            const formData = new FormData(e.target);
            const form = Object.fromEntries(formData.entries());
            form.redirect = redirect;
            setForm(form);
            await data.onSubmit(
              form,
              (error) => {
                setIsSubmitting(false);
                setError(error);
              },
              setSuccess
            );
          }}
        >
          {!isAppLoaded ? (
            <>
              <Loading />
            </>
          ) : isSubmitting ? (
            <>
              <Loader title={data.loading.title} text={data.loading.text} />
            </>
          ) : (
            <>
              <Image
                alignSelf="center"
                src={theme === "dark" ? LogoDark : Logo}
                width={50}
                mb={4}
              />

              <Text variant="heading" textAlign="center" fontWeight="heading">
                {data.title}
              </Text>
              <Text
                variant="body"
                mt={1}
                textAlign="center"
                color="fontTertiary"
              >
                {data.subtitle.text}{" "}
                {data.subtitle.action && (
                  <Text
                    sx={{
                      ":hover": { color: "dimPrimary" },
                      cursor: "pointer",
                    }}
                    as="b"
                    color="primary"
                    onClick={data.subtitle.action.onClick}
                  >
                    {data.subtitle.action.text}
                  </Text>
                )}
              </Text>
              <Field
                styles={{
                  container: { mt: 4 },
                }}
                autoFocus
                data-test-id="email"
                id="email"
                required
                name="email"
                autoComplete="email"
                label={data.labels.email}
                helpText={data.helpTexts?.email}
                defaultValue={form.email}
              />
              {data.labels.password && (
                <Field
                  styles={{
                    container: { mt: 2 },
                  }}
                  data-test-id="password"
                  id="password"
                  required
                  name="password"
                  autoComplete={data.autoComplete?.password}
                  label={data.labels.password}
                  type="password"
                  defaultValue={form.password}
                />
              )}

              {data.confirmPassword && (
                <Field
                  styles={{
                    container: { mt: 2 },
                  }}
                  data-test-id="confirm-password"
                  id="confirmPassword"
                  required
                  name="confirmPassword"
                  autoComplete="confirm-password"
                  label="Confirm your password"
                  type="password"
                  defaultValue={form.confirmPassword}
                />
              )}

              {/* {data.supportsPasswordRecovery && (
                <Button
                  type="button"
                  alignSelf="start"
                  mt={2}
                  variant="anchor"
                  onClick={() => hardNavigate("/recover", getQueryParams())}
                >
                  Forgot password?
                </Button>
              )}*/}
              <Button
                data-test-id="submitButton"
                display="flex"
                type="submit"
                mt={4}
                variant="primary"
                sx={{ borderRadius: "default" }}
                justifyContent="center"
                alignItems="center"
              >
                {data.primaryAction.text}
              </Button>
              {data.secondaryAction && (
                <>
                  <Button
                    type="button"
                    variant="anchor"
                    mt={2}
                    alignSelf="center"
                    onClick={data.secondaryAction.onClick}
                  >
                    {data.secondaryAction.text}
                  </Button>
                </>
              )}
              {error && (
                <Flex
                  bg="errorBg"
                  p={1}
                  mt={2}
                  sx={{ borderRadius: "default" }}
                >
                  <Error size={15} color="error" />
                  <Text variant="error" ml={1}>
                    {error}
                  </Text>
                </Flex>
              )}
              {success && (
                <Flex bg="shade" p={1} mt={2} sx={{ borderRadius: "default" }}>
                  <CheckCircle size={15} color="primary" />
                  <Text variant="error" color="primary" ml={1}>
                    {success}
                  </Text>
                </Flex>
              )}
              {data.agreementText && (
                <Text mt={2} variant="subBody" textAlign="center">
                  {data.agreementText}
                </Text>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default Auth;

function redirectToURL(url) {
  Config.set("skipInitiation", true);
  hardNavigate(url);
}
