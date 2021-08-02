import { useEffect, useState } from "react";
import { Box, Button, Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import * as Icon from "../components/icons";
import Field from "../components/field";
import { getQueryParams, navigate, useQueryParams } from "../navigation";
import { store as userstore } from "../stores/user-store";
import { db } from "../common/db";

const features = [
  {
    title: "Welcome to Notesnook",
    description:
      "Did you know that the best note taking apps can secretly read all your notes? But Notesnook is different.",
  },
  {
    title: "100% end-to-end encrypted notes",
    description:
      "All your notes are encrypted on your device. No one except you can read your notes.",
    link: "https://docs.notesnook.com/how-is-my-data-encrypted/",
    linkText: "Learn how we encrypt your data",
  },
  {
    title: "Sync to unlimited devices",
    description:
      "Notesnook works 100% offline and you can install it on all your mobile, tablet and PC. Your notes are always with you where ever you go.",
  },
  {
    title: "Write better. Faster. Smarter.",
    description:
      "Edit your notes the way you want. You can add images, videos, tables and even use markdown.",
  },
  {
    title: "Organize to remember, not to put away",
    description:
      "With notebooks, tags and colors you can find your notes easily.",
  },
  {
    title: "Join our community",
    description:
      "We are not ghosts, chat with us and share your experience. Give suggestions, report issues and meet other people using Notesnook",
    link: "https://discord.gg/zQBK97EE22",
    linkText: "Join now",
  },
];

var interval = null;
const authTypes = {
  signup: {
    title: "Create an account",
    subtitle: {
      text: "Already have an account?",
      action: {
        text: "Log in",
        onClick: () => navigate("/login", getQueryParams()),
      },
    },
    labels: { email: "Your email", password: "Set password" },
    autoComplete: { password: "new-password" },
    primaryAction: {
      text: "Create account",
      loadingText: "Creating account...",
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
      return await userstore
        .signup(form)
        .then(async () => navigate(form.redirect || "/"))
        .catch((e) => onError(e.message));
    },
  },
  login: {
    title: "Welcome back!",
    subtitle: {
      text: "Don't have an account?",
      action: {
        text: "Sign up!",
        onClick: () => navigate("/signup", getQueryParams()),
      },
    },
    autoComplete: { password: "current-password" },
    labels: { email: "Your email", password: "Your password" },
    primaryAction: {
      text: "Login to your account",
      loadingText: "Logging in...",
    },
    supportsPasswordRecovery: true,
    onSubmit: async (form, onError) => {
      return await userstore
        .login(form)
        .then(async () => navigate(form.redirect || "/"))
        .catch((e) => onError(e.message));
    },
  },
  recover: {
    title: "Recover your account",
    subtitle: {
      text: "Remember your password?",
      action: {
        text: "Log in",
        onClick: () => navigate("/login", getQueryParams()),
      },
    },
    helpTexts: {
      email:
        "Enter your Notesnook account email so we can send you instructions on how to recover your account.",
    },
    labels: { email: "Email address" },
    primaryAction: {
      text: "Recover account",
      loadingText: "Sending recovery email...",
    },
    onSubmit: async (form, onError, onSuccess) => {
      return await db.user
        .recoverAccount(form.email.toLowerCase())
        .then(async () =>
          onSuccess("Recovery email sent. Please check your inbox (and spam).")
        )
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
  const [featureIndex, setFeatureIndex] = useState(0);

  const data = authTypes[type];
  const feature = features[featureIndex];

  useEffect(() => {
    clearInterval(interval);
    interval = setInterval(() => {
      setFeatureIndex((s) => ++s % features.length);
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isSubmitting) {
      setError();
      setSuccess();
    }
  }, [isSubmitting]);

  return (
    <ThemeProvider>
      <Flex
        bg="background"
        height={"100%"}
        overflowY="auto"
        flexDirection={"row"}
      >
        <Button
          variant="secondary"
          display="flex"
          alignItems="center"
          sx={{ position: "absolute", top: 3, right: 30, cursor: "pointer" }}
          title="Go to app"
          onClick={() => navigate("/")}
        >
          <Icon.ArrowRight size={16} />
          <Text variant="body" ml={1}>
            Go to app
          </Text>
        </Button>
        <Box
          flexDirection="column"
          justifyContent="center"
          flex={0.35}
          bg="primary"
          p={50}
          display={["none", "none", "flex"]}
        >
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
          >
            <Text
              color="static"
              variant="title"
              fontWeight="heading"
              ml={1}
              fontSize={20}
            >
              Notesnook
            </Text>

            <Flex mt={100} flexDirection="column" height={250}>
              <Text
                color="static"
                variant="heading"
                fontWeight="bold"
                fontSize="2em"
              >
                {feature.title}
              </Text>
              <Text mt={4} variant="body" fontSize={"1.1em"} color="static">
                {feature.description}
              </Text>
              {feature.link && (
                <Flex
                  as="a"
                  sx={{
                    textDecorationLine: "underline",
                    textDecorationColor: "#fff",
                  }}
                  href={feature.link}
                  mt={4}
                  alignItems="center"
                >
                  <Icon.ArrowRight size={18} color="static" />
                  <Text variant="title" ml={1} color="static">
                    {feature.linkText}
                  </Text>
                </Flex>
              )}
            </Flex>
            <Flex alignSelf="center" mt={50}>
              {features.map((_, i) => (
                <Box
                  key={i}
                  height={5}
                  width={20}
                  mr={1}
                  sx={{ borderRadius: 100 }}
                  bg={featureIndex === i ? "static" : "#ffffff99"}
                  onClick={() => setFeatureIndex(i)}
                />
              ))}
            </Flex>
          </Flex>
        </Box>
        <Flex justifyContent="center" flex={1} flexShrink={0}>
          <Flex
            as="form"
            flexDirection="column"
            justifyContent="center"
            alignItems="stretch"
            width={["95%", "55%", "35%"]}
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              const form = new FormData(e.target);
              const obj = Object.fromEntries(form.entries());
              obj.redirect = redirect;
              await data.onSubmit(obj, setError, setSuccess);
              setIsSubmitting(false);
            }}
          >
            <Text variant="heading" textAlign="center" fontWeight="heading">
              {data.title}
            </Text>
            <Text variant="body" mt={1} textAlign="center" color="fontTertiary">
              {data.subtitle.text}{" "}
              {data.subtitle.action && (
                <Text
                  sx={{ ":hover": { color: "dimPrimary" }, cursor: "pointer" }}
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
                container: { mt: 50 },
              }}
              id="email"
              required
              name="email"
              autoComplete="email"
              label={data.labels.email}
              helpText={data.helpTexts?.email}
            />
            {data.labels.password && (
              <Field
                styles={{
                  container: { mt: 2 },
                }}
                id="password"
                required
                name="password"
                autoComplete={data.autoComplete?.password}
                label={data.labels.password}
                type="password"
              />
            )}

            {data.supportsPasswordRecovery && (
              <Button
                type="button"
                alignSelf="start"
                mt={2}
                variant="anchor"
                onClick={() => navigate("/recover", getQueryParams())}
              >
                Forgot password?
              </Button>
            )}
            <Button
              display="flex"
              type="submit"
              mt={4}
              variant="primary"
              disabled={isSubmitting}
              sx={{ borderRadius: "default" }}
              justifyContent="center"
              alignItems="center"
            >
              {isSubmitting ? (
                <>
                  <Icon.Loading color="static" size={16} sx={{ mr: 1 }} />{" "}
                  {data.primaryAction.loadingText}
                </>
              ) : (
                data.primaryAction.text
              )}
            </Button>
            {data.secondaryAction && (
              <Button
                type="button"
                variant="secondary"
                mt={1}
                onClick={data.secondaryAction.onClick}
              >
                {data.secondaryAction.text}
              </Button>
            )}
            {error && (
              <Flex bg="errorBg" p={1} mt={2} sx={{ borderRadius: "default" }}>
                <Icon.Error size={15} color="error" />
                <Text variant="error" ml={1}>
                  {error}
                </Text>
              </Flex>
            )}
            {success && (
              <Flex bg="shade" p={1} mt={2} sx={{ borderRadius: "default" }}>
                <Icon.CheckCircle size={15} color="primary" />
                <Text variant="error" color="primary" ml={1}>
                  {success}
                </Text>
              </Flex>
            )}
            {data.agreementText && (
              <Text mt={2} variant="subBody">
                {data.agreementText}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default Auth;
