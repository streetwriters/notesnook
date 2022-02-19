import { useEffect, useState } from "react";
import { Button, Flex, Text } from "rebass";
import {
  CheckCircle,
  Loading,
  Error,
  ArrowRight,
  ArrowLeft,
} from "../components/icons";
import Field from "../components/field";
import { getQueryParams, hardNavigate, useQueryParams } from "../navigation";
import { store as userstore } from "../stores/user-store";
import { db } from "../common/db";
import Config from "../utils/config";
import useDatabase from "../hooks/use-database";
import Loader from "../components/loader";
import {
  showLoadingDialog,
  showLogoutConfirmation,
} from "../common/dialog-controller";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";

const authTypes = {
  sessionexpired: {
    title: "Your session has expired",
    subtitle: {
      text: (
        <Flex bg="shade" p={1} sx={{ borderRadius: "default" }}>
          <Text as="span" fontSize="body" color="primary">
            <b>
              All your local changes are safe and will be synced after you
              relogin.
            </b>{" "}
            Please enter your password to continue.
          </Text>
        </Flex>
      ),
    },
    fields: [
      {
        id: "email",
        name: "email",
        label: "Your account email",
        defaultValue: (user) => maskEmail(user?.email),
        disabled: true,
        autoComplete: "false",
        type: "email",
      },
      {
        id: "password",
        name: "password",
        label: "Enter your password",
        autoComplete: "current-password",
        type: "password",
        autoFocus: true,
      },
    ],
    primaryAction: {
      text: "Relogin to your account",
    },
    secondaryAction: {
      text: <Text color="error">Logout permanently</Text>,
      onClick: async () => {
        if (await showLogoutConfirmation()) {
          await showLoadingDialog({
            title: "You are being logged out",
            action: () => db.user.logout(true),
          });
          showToast("success", "You have been logged out.");
          Config.set("sessionExpired", false);
          window.location.replace("/login");
        }
      },
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
          Config.set("sessionExpired", false);
          redirectToURL(form.redirect || "/");
        })
        .catch((e) => onError(e.message));
    },
  },
  signup: {
    title: "Create an account",
    subtitle: {
      text: "Already have an account?",
      action: {
        text: "Log in",
        onClick: () => hardNavigate("/login", getQueryParams()),
      },
    },
    fields: [
      {
        id: "email",
        name: "email",
        label: "Enter email",
        autoComplete: "email",
        type: "email",
        autoFocus: true,
      },
      {
        id: "password",
        name: "password",
        label: "Set password",
        autoComplete: "new-password",
        type: "password",
      },
      {
        id: "confirm-password",
        name: "confirmPassword",
        label: "Confirm password",
        autoComplete: "confirm-password",
        type: "password",
      },
    ],
    primaryAction: {
      text: "Agree & continue",
    },
    secondaryAction: {
      text: "Continue without creating an account",
      icon: <ArrowRight size={18} />,
      onClick: () => {
        redirectToURL("/");
      },
    },
    loading: {
      title: "Creating your account",
      text: "Please wait while we finalize your account.",
    },
    footer: (
      <>
        By pressing "Create account" button, you agree to our{" "}
        <Text
          as="a"
          color="text"
          target="_blank"
          rel="noreferrer"
          href="https://notesnook.com/tos"
        >
          Terms of Service
        </Text>{" "}
        &amp;{" "}
        <Text
          as="a"
          color="text"
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
    fields: [
      {
        type: "email",
        id: "email",
        name: "email",
        label: "Enter email",
        autoComplete: "email",
        autoFocus: true,
        defaultValue: (_user, form) => form.email,
      },
      {
        type: "password",
        id: "password",
        name: "password",
        label: "Enter password",
        autoComplete: "current-password",
        defaultValue: (_user, form) => form.password,
      },
    ],
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
  recover: {
    resetOnNavigate: false,
    title: "Recover your account",
    subtitle: {
      text: "Remembered your password?",
      action: {
        text: "Log in",
        onClick: () => hardNavigate("/login", getQueryParams()),
      },
    },
    fields: [
      {
        type: "email",
        id: "email",
        name: "email",
        label: "Enter your account email",
        autoComplete: "email",
        helpText:
          "You will receive instructions on how to recover your account on this email",
        autoFocus: true,
        defaultValue: (user, form) => form?.email || user?.email,
      },
    ],
    primaryAction: {
      text: "Send recovery email",
    },
    loading: {
      title: "Sending recovery email",
      text: "Please wait while we send you recovery instructions",
    },
    onSubmit: async (form, onError, onSuccess) => {
      return await db.user
        .recoverAccount(form.email.toLowerCase())
        .then(async (url) => {
          return redirectToURL(url);

          // onSuccess(
          //   "Recovery email sent. Please check your inbox (and spam folder)."
          // );
        })
        .catch((e) => onError(e.message));
    },
  },
};

function Auth(props) {
  const { type } = props;
  const [{ redirect }] = useQueryParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const [success, setSuccess] = useState();
  const [isAppLoaded] = useDatabase();
  const [form, setForm] = useState({});
  const [user, setUser] = useState();

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
      const isSessionExpired = Config.get("sessionExpired", false);
      if (user) {
        if (
          (type === "recover" || type === "sessionexpired") &&
          isSessionExpired
        )
          setUser(user);
        else redirectToURL("/");
      } else if (type === "sessionexpired") {
        redirectToURL("/");
      }
    })();
  }, [isAppLoaded, type]);

  return (
    <AuthContainer>
      {isSubmitting ? (
        <>
          <Loader title={data.loading.title} text={data.loading.text} />
        </>
      ) : (
        <Flex
          flexDirection={"column"}
          sx={{
            zIndex: 1,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {data.secondaryAction ? (
            <>
              <Button
                type="button"
                variant="icon"
                mr={20}
                mt={20}
                alignSelf="end"
                onClick={data.secondaryAction.onClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "default",
                  color: "icon",
                }}
              >
                <Text mr={1}>{data.secondaryAction.text}</Text>
                {data.secondaryAction.icon}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="icon"
              ml={20}
              mt={20}
              alignSelf="start"
              title="Go to app"
              onClick={() => hardNavigate("/")}
              sx={{
                display: "flex",
                alignItems: "center",
                borderRadius: "default",
                color: "icon",
              }}
            >
              <ArrowLeft />
            </Button>
          )}

          <Flex
            as="form"
            id="authForm"
            flexDirection="column"
            alignSelf="center"
            justifyContent={"center"}
            alignItems="center"
            flex={1}
            onSubmit={async (e) => {
              console.log(e);
              e.preventDefault();
              setIsSubmitting(true);
              const formData = new FormData(e.target);
              const form = Object.fromEntries(formData.entries());
              form.redirect = redirect;
              if (user) form.email = user.email;
              setForm(form);
              await data.onSubmit(
                form,
                (error) => {
                  setIsSubmitting(false);
                  setError(error);
                },
                (message) => {
                  setSuccess(message);
                  setIsSubmitting(false);
                }
              );
            }}
          >
            <Text variant={"heading"} fontSize={32} textAlign="center">
              {data.title}
            </Text>
            <Text
              variant="body"
              fontSize={"title"}
              textAlign="center"
              mt={2}
              mb={35}
              color="fontTertiary"
            >
              {data.subtitle.text}{" "}
              {data.subtitle.action && (
                <Text
                  sx={{
                    textDecoration: "underline",
                    ":hover": { color: "dimPrimary" },
                    cursor: "pointer",
                  }}
                  as="b"
                  color="text"
                  onClick={data.subtitle.action.onClick}
                >
                  {data.subtitle.action.text}
                </Text>
              )}
            </Text>
            {success && (
              <Flex bg="shade" p={1} mt={2} sx={{ borderRadius: "default" }}>
                <CheckCircle size={15} color="primary" />
                <Text variant="error" color="primary" ml={1}>
                  {success}
                </Text>
              </Flex>
            )}
            {data.fields?.map(({ defaultValue, id, autoFocus, ...rest }) => (
              <Field
                {...rest}
                id={id}
                key={id}
                required
                styles={{
                  container: { mt: 2, width: 400 },
                  label: { fontWeight: "normal" },
                  input: {
                    p: "12px",
                    borderRadius: "default",
                    bg: "background",
                    boxShadow: "0px 0px 5px 0px #00000019",
                  },
                }}
                data-test-id={id}
                autoFocus={autoFocus}
                defaultValue={defaultValue && defaultValue(user, form)}
              />
            ))}
            {data.supportsPasswordRecovery && (
              <Button
                type="button"
                alignSelf="end"
                data-test-id="auth-forgot-password"
                mt={2}
                variant="anchor"
                color="text"
                onClick={() => hardNavigate("/recover", getQueryParams())}
              >
                Forgot password?
              </Button>
            )}
            <Button
              data-test-id="submitButton"
              display="flex"
              type="submit"
              mt={50}
              variant="primary"
              alignSelf={"center"}
              px={50}
              sx={{ borderRadius: 50 }}
              justifyContent="center"
              alignItems="center"
              disabled={!isAppLoaded}
            >
              {isAppLoaded ? (
                data.primaryAction.text
              ) : (
                <Loading color="static" />
              )}
            </Button>
            {error && (
              <Flex bg="errorBg" p={1} mt={2} sx={{ borderRadius: "default" }}>
                <Error size={15} color="error" />
                <Text variant="error" ml={1}>
                  {error}
                </Text>
              </Flex>
            )}

            {data.footer && (
              <Text
                mt={4}
                maxWidth={350}
                variant="subBody"
                fontSize={13}
                textAlign="center"
              >
                {data.footer}
              </Text>
            )}
          </Flex>
        </Flex>
      )}
    </AuthContainer>
  );
}
export default Auth;

function redirectToURL(url) {
  Config.set("skipInitiation", true);
  hardNavigate(url);
}

function maskEmail(email) {
  if (!email) return "";
  const [username, domain] = email.split("@");
  const maskChars = "*".repeat(
    username.substring(2, username.length - 2).length
  );
  return `${username.substring(0, 2)}${maskChars}${username.substring(
    username.length - 2
  )}@${domain}`;
}
