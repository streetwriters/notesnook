import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Text } from "rebass";
import {
  CheckCircle,
  Loading,
  Error as ErrorIcon,
  MFAAuthenticator,
  MFASMS,
  MFAEmail,
  MFARecoveryCode,
  ArrowRight,
  Logout,
} from "../components/icons";
import Field from "../components/field";
import { getQueryParams, hardNavigate, makeURL } from "../navigation";
import { store as userstore } from "../stores/user-store";
import { db } from "../common/db";
import Config from "../utils/config";
import useDatabase from "../hooks/use-database";
import Loader from "../components/loader";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";
import { isTesting } from "../utils/platform";
import { AuthenticatorType } from "../components/dialogs/multi-factor-dialog";
import { RequestError } from "notes-core/utils/http";
import { useTimer } from "../hooks/use-timer";

type LoginFormData = {
  email: string;
  password: string;
};

type MFALoginFormData = LoginFormData & {
  code?: string;
  method?: MFAMethodType;
};

type SignupFormData = LoginFormData & {
  confirmPassword: string;
};

type AccountRecoveryFormData = {
  email: string;
};

type MFAFormData = LoginFormData & {
  selectedMethod: MFAMethodType;
  primaryMethod: MFAMethodType;
  code?: string;
  token: string;
  secondaryMethod?: MFAMethodType;
  phoneNumber?: string;
};

type MFAErrorData = {
  primaryMethod: MFAMethodType;
  token: string;
  secondaryMethod?: MFAMethodType;
  phoneNumber?: string;
};

type AuthFormData = {
  login: LoginFormData;
  signup: SignupFormData;
  sessionExpiry: LoginFormData;
  recover: AccountRecoveryFormData;
  "mfa:code": MFAFormData;
  "mfa:select": MFAFormData;
};

type BaseFormData =
  | MFAFormData
  | LoginFormData
  | AccountRecoveryFormData
  | SignupFormData;

type NavigateFunction = <TRoute extends AuthRoutes>(
  route: TRoute,
  formData?: AuthFormData[TRoute]
) => void;
type BaseAuthComponentProps<TRoute extends AuthRoutes> = {
  navigate: NavigateFunction;
  formData?: AuthFormData[TRoute];
};
type AuthRoutes =
  | "sessionExpiry"
  | "login"
  | "signup"
  | "recover"
  | "mfa:code"
  | "mfa:select";
type AuthProps = { route: AuthRoutes };

type AuthComponent<TRoute extends AuthRoutes> = (
  props: BaseAuthComponentProps<TRoute>
) => JSX.Element;

function getRouteComponent<TRoute extends AuthRoutes>(
  route: TRoute
): AuthComponent<TRoute> | undefined {
  switch (route) {
    case "login":
      return Login as AuthComponent<TRoute>;
    case "signup":
      return Signup as AuthComponent<TRoute>;
    case "sessionExpiry":
      return SessionExpiry as AuthComponent<TRoute>;
    case "recover":
      return AccountRecovery as AuthComponent<TRoute>;
    case "mfa:code":
      return MFACode as AuthComponent<TRoute>;
    case "mfa:select":
      return MFASelector as AuthComponent<TRoute>;
  }
  return undefined;
}

const routePaths: Record<AuthRoutes, string> = {
  login: "/login",
  recover: "/recover",
  sessionExpiry: "/sessionexpired",
  signup: "/signup",
  "mfa:code": "/mfa/code",
  "mfa:select": "/mfa/select",
};

function Auth(props: AuthProps) {
  const [route, setRoute] = useState(props.route);
  const [storedFormData, setStoredFormData] = useState<
    BaseFormData | undefined
  >();
  const Route = useMemo(() => getRouteComponent(route), [route]);
  useEffect(() => {
    window.history.replaceState({}, "", makeURL(routePaths[route]));
  }, [route]);

  return (
    <AuthContainer>
      <Flex
        flexDirection={"column"}
        sx={{
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {route === "login" || route === "signup" || route === "recover" ? (
          <Button
            sx={{
              display: "flex",
              mt: 2,
              mr: 2,
              alignSelf: "end",
              alignItems: "center",
            }}
            variant={"secondary"}
            onClick={() => openURL("/notes/")}
          >
            Jump to app <ArrowRight size={18} sx={{ ml: 1 }} />
          </Button>
        ) : route === "sessionExpiry" ? (
          <>
            <Button
              variant={"secondary"}
              sx={{
                display: "flex",
                mt: 2,
                mr: 2,
                alignSelf: "end",
                alignItems: "center",
              }}
              onClick={() => db.user?.logout()}
              color="error"
            >
              <Logout size={16} sx={{ mr: 1 }} color="error" /> Logout
              permanently
            </Button>
          </>
        ) : null}

        {Route && (
          <Route
            navigate={(route, formData) => {
              setStoredFormData(formData);
              setRoute(route);
            }}
            formData={storedFormData}
          />
        )}
      </Flex>
    </AuthContainer>
  );
}
export default Auth;

function Login(props: BaseAuthComponentProps<"login">) {
  const { navigate } = props;
  const [isAppLoaded] = useDatabase();

  return (
    <AuthForm
      type="login"
      title="Welcome back!"
      subtitle={
        <SubtitleWithAction
          text="Don't have an account?"
          action={{ text: "Sign up", onClick: () => navigate("signup") }}
        />
      }
      loading={{
        title: "Logging you in",
        subtitle: "Please wait while you are authenticated.",
      }}
      onSubmit={(form) => login(form, navigate)}
    >
      {(form?: LoginFormData) => (
        <>
          <AuthField
            id="email"
            type="email"
            autoComplete="email"
            label="Enter email"
            autoFocus={!form?.password}
            defaultValue={form?.email}
          />
          <AuthField
            id="password"
            type="password"
            autoComplete="current-password"
            label="Enter password"
            autoFocus={!!form?.password}
          />
          <Button
            data-test-id="auth-forgot-password"
            type="button"
            alignSelf="end"
            mt={2}
            variant="anchor"
            color="text"
            onClick={() => navigate("recover")}
          >
            Forgot password?
          </Button>
          <SubmitButton
            text="Login to your account"
            disabled={!isAppLoaded}
            loading={!isAppLoaded}
          />
        </>
      )}
    </AuthForm>
  );
}

function Signup(props: BaseAuthComponentProps<"signup">) {
  const { navigate } = props;
  const [isAppLoaded] = useDatabase();

  return (
    <AuthForm
      type="signup"
      title="Create an account"
      subtitle={
        <SubtitleWithAction
          text="Already have an account?"
          action={{ text: "Log in", onClick: () => navigate("login") }}
        />
      }
      loading={{
        title: "Creating your account",
        subtitle: "Please wait while we finalize your account.",
      }}
      onSubmit={async (form) => {
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await userstore.signup(form);
        openURL("/notes/#/welcome");
      }}
    >
      {(form?: SignupFormData) => (
        <>
          <AuthField
            id="email"
            type="email"
            autoComplete="email"
            label="Enter email"
            autoFocus
            defaultValue={form?.email}
          />
          <AuthField
            id="password"
            type="password"
            autoComplete="current-password"
            label="Set password"
            defaultValue={form?.password}
          />
          <AuthField
            id="confirm-password"
            type="password"
            autoComplete="confirm-password"
            label="Confirm password"
            defaultValue={form?.confirmPassword}
          />
          <SubmitButton
            text="Create account"
            disabled={!isAppLoaded}
            loading={!isAppLoaded}
          />
          <Text mt={4} variant="subBody" fontSize={13} textAlign="center">
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
          </Text>
        </>
      )}
    </AuthForm>
  );
}

function SessionExpiry(props: BaseAuthComponentProps<"sessionExpiry">) {
  const { navigate } = props;
  const [isAppLoaded] = useDatabase();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    if (!isAppLoaded) return;
    (async () => {
      const user = await db.user?.getUser();
      const isSessionExpired = Config.get("sessionExpired", false);
      if (user && isSessionExpired) {
        setUser(user);
      } else openURL("/");
    })();
  }, [isAppLoaded]);

  return (
    <AuthForm
      type="sessionExpiry"
      title="Your session has expired"
      subtitle={
        <Flex bg="shade" p={1} sx={{ borderRadius: "default" }}>
          <Text as="span" fontSize="body" color="primary">
            <b>
              All your local changes are safe and will be synced after you
              login.
            </b>{" "}
            Please enter your password to continue.
          </Text>
        </Flex>
      }
      loading={{
        title: "Logging you in",
        subtitle: "Please wait while you are authenticated.",
      }}
      onSubmit={async (form) => {
        if (!user) return;
        await login({ email: user.email, password: form.password }, navigate);
      }}
    >
      <AuthField
        id="email"
        type="email"
        autoComplete={"false"}
        label="Enter email"
        defaultValue={user ? maskEmail(user.email) : undefined}
        autoFocus
        disabled
      />
      <AuthField
        id="password"
        type="password"
        autoComplete="current-password"
        label="Enter password"
      />
      <Button
        data-test-id="auth-forgot-password"
        type="button"
        alignSelf="end"
        mt={2}
        variant="anchor"
        color="text"
        onClick={() => navigate("recover", { email: user!.email })}
      >
        Forgot password?
      </Button>
      <SubmitButton
        text="Relogin to your account"
        disabled={!isAppLoaded}
        loading={!isAppLoaded}
      />
    </AuthForm>
  );
}

function AccountRecovery(props: BaseAuthComponentProps<"recover">) {
  const { navigate, formData } = props;
  const [isAppLoaded] = useDatabase();
  const [success, setSuccess] = useState<string>();

  return (
    <AuthForm
      type="recover"
      title="Recover your account"
      subtitle={
        <SubtitleWithAction
          text="Remembered your password?"
          action={{ text: "Log in", onClick: () => navigate("login") }}
        />
      }
      loading={{
        title: "Sending recovery email",
        subtitle: "Please wait while we send you recovery instructions.",
      }}
      onSubmit={async (form) => {
        const url = await db.user?.recoverAccount(form.email.toLowerCase());
        if (isTesting()) return openURL(url);
        setSuccess(
          `Recovery email sent. Please check your inbox (and spam folder) for further instructions.`
        );
      }}
    >
      {success ? (
        <Flex bg="background" p={2} mt={2} sx={{ borderRadius: "default" }}>
          <CheckCircle size={20} color="primary" />
          <Text variant="body" color="primary" ml={2}>
            {success}
          </Text>
        </Flex>
      ) : (
        <>
          <AuthField
            id="email"
            type="email"
            autoComplete={"email"}
            label="Enter your account email"
            helpText="You will receive instructions on how to recover your account on this email"
            defaultValue={formData ? formData.email : ""}
            autoFocus
          />
          <SubmitButton
            text="Send recovery email"
            disabled={!isAppLoaded}
            loading={!isAppLoaded}
          />
        </>
      )}
    </AuthForm>
  );
}

function getTexts(formData: MFAFormData) {
  return {
    app: {
      subtitle:
        "Please confirm your identity by entering the authentication code from your authenticator app.",
      instructions: `Open the two-factor authentication (TOTP) app to view your authentication code.`,
      selector: `Don't have access to your authenticator app?`,
      label: "Enter 6-digit code",
    },
    email: {
      subtitle:
        "Please confirm your identity by entering the authentication code sent to your email address.",
      instructions: `It may take a minute to receive your code.`,
      selector: `Don't have access to your email address?`,
      label: "Enter 6-digit code",
    },
    sms: {
      subtitle: `Please confirm your identity by entering the authentication code sent to ${
        formData.phoneNumber || "your registered phone number."
      }.`,
      instructions: `It may take a minute to receive your code.`,
      selector: `Don't have access to your phone number?`,
      label: "Enter 6-digit code",
    },
    recoveryCode: {
      subtitle: `Please confirm your identity by entering a recovery code.`,
      instructions: "",
      selector: `Don't have your recovery codes?`,
      label: "Enter recovery code",
    },
  };
}

function MFACode(props: BaseAuthComponentProps<"mfa:code">) {
  const { navigate, formData } = props;
  const [isAppLoaded] = useDatabase();
  const [isSending, setIsSending] = useState(false);
  const { elapsed, enabled, setEnabled } = useTimer(
    `2fa.${formData?.primaryMethod}`,
    60
  );

  const sendCode = useCallback(
    async (selectedMethod, token) => {
      setIsSending(true);
      try {
        await db.mfa!.sendCode(selectedMethod, token);
        setEnabled(false);
      } catch (e) {
        const error = e as Error;
        console.error(error);
        showToast("error", error.message);
      } finally {
        setIsSending(false);
      }
    },
    [setEnabled]
  );

  useEffect(() => {
    if (
      !formData ||
      formData.selectedMethod === "recoveryCode" ||
      formData.selectedMethod === "app"
    )
      return;

    (async function () {
      await sendCode(formData.selectedMethod, formData.token);
    })();
  }, [formData, sendCode]);

  if (!formData) {
    openURL("/");
    return null;
  }

  const { selectedMethod, token } = formData;
  const texts = getTexts(formData)[selectedMethod];

  return (
    <AuthForm
      type="mfa:code"
      title="Two-factor authentication"
      subtitle={texts.subtitle}
      loading={{
        title: "Logging you in",
        subtitle: "Please wait while you are authenticated.",
      }}
      onSubmit={async (form) => {
        const loginForm: MFALoginFormData = {
          email: formData.email,
          password: formData.password,
          code: form.code,
          method: formData.selectedMethod,
        };
        await login(loginForm, navigate);
      }}
    >
      <AuthField
        id="code"
        type="number"
        autoComplete={"one-time-code"}
        label={texts.label}
        autoFocus
        pattern="[0-9]*"
        inputMode="numeric"
        helpText={texts.instructions}
        action={
          selectedMethod === "sms" || selectedMethod === "email"
            ? {
                disabled: isSending || !enabled,
                component: (
                  <Text variant={"body"}>
                    {isSending ? (
                      <Loading size={18} />
                    ) : enabled ? (
                      `Resend code`
                    ) : (
                      `Resend in ${elapsed}`
                    )}
                  </Text>
                ),
                onClick: async () => {
                  await sendCode(selectedMethod, token);
                },
              }
            : undefined
        }
      />
      <SubmitButton
        text="Submit"
        disabled={!isAppLoaded}
        loading={!isAppLoaded}
      />
      <Button
        type="button"
        mt={4}
        variant={"anchor"}
        color="text"
        onClick={() => navigate("mfa:select", formData)}
      >
        {texts.selector}
      </Button>
    </AuthForm>
  );
}

type MFAMethodType = AuthenticatorType | "recoveryCode";
type MFAMethod = {
  type: MFAMethodType;
  title: string;
  icon: (props: any) => JSX.Element;
};
const MFAMethods: MFAMethod[] = [
  { type: "app", title: "Use an authenticator app", icon: MFAAuthenticator },
  { type: "sms", title: "Send code to your phone number", icon: MFASMS },
  { type: "email", title: "Send code to your email address", icon: MFAEmail },
  { type: "recoveryCode", title: "Use a recovery code", icon: MFARecoveryCode },
];
function MFASelector(props: BaseAuthComponentProps<"mfa:select">) {
  const { navigate, formData } = props;
  const [selected, setSelected] = useState(0);
  const isValidMethod = useCallback(
    (method: MFAMethodType) => {
      return (
        method === formData?.primaryMethod ||
        method === formData?.secondaryMethod ||
        method === "recoveryCode"
      );
    },
    [formData]
  );
  if (!formData) {
    openURL("/");
    return null;
  }

  return (
    <AuthForm
      type="mfa:select"
      title="Select two-factor authentication method"
      subtitle={`Where should we send you the authentication code?`}
      loading={{
        title: "Logging you in",
        subtitle: "Please wait while you are authenticated.",
      }}
      onSubmit={async (form) => {
        const selectedType = MFAMethods[selected];
        formData.selectedMethod = selectedType.type;
        navigate("mfa:code", formData);
      }}
    >
      {MFAMethods.map(
        (method, index) =>
          isValidMethod(method.type) && (
            <Button
              type="submit"
              variant={"secondary"}
              mt={2}
              sx={{
                ":first-of-type": { mt: 2 },
                display: "flex",
                bg: "bgSecondary",
                alignSelf: "stretch",
                alignItems: "center",
                textAlign: "left",
                px: 2,
              }}
              onClick={() => setSelected(index)}
            >
              <method.icon
                sx={{
                  bg: selected === index ? "shade" : "border",
                  borderRadius: 100,
                  width: 35,
                  height: 35,
                  mr: 2,
                }}
                size={16}
                color={selected === index ? "primary" : "text"}
              />
              <Text variant={"title"} fontWeight="body">
                {method.title}
              </Text>
            </Button>
          )
      )}
      {/* <SubmitButton
        text="Submit"
        disabled={!isAppLoaded}
        loading={!isAppLoaded}
      /> */}
      {/* <Button type="button" mt={4} variant={"anchor"} color="text">
        Don't have access to your {mfaMethodToPhrase(formData.primaryMethod)}?
      </Button> */}
    </AuthForm>
  );
}

// function MFAMethodSelector(params) {}

type AuthFormProps<TType extends AuthRoutes> = {
  title: string;
  subtitle: string | JSX.Element;
  loading: { title: string; subtitle: string };
  type: TType;
  onSubmit: (form: AuthFormData[TType]) => Promise<void>;
  children?:
    | React.ReactNode
    | ((form?: AuthFormData[TType]) => React.ReactNode);
};

function AuthForm<T extends AuthRoutes>(props: AuthFormProps<T>) {
  const { title, subtitle, children } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>();
  const [form, setForm] = useState<AuthFormData[T] | undefined>();

  if (isSubmitting)
    return <Loader title={props.loading.title} text={props.loading.subtitle} />;

  return (
    <Flex
      ref={formRef}
      as="form"
      id="authForm"
      flexDirection="column"
      alignSelf="center"
      justifyContent={"center"}
      alignItems="center"
      width={["95%", 420]}
      flex={1}
      onSubmit={async (e) => {
        e.preventDefault();

        setError("");
        setIsSubmitting(true);
        const formData = new FormData(formRef.current);
        const form = Object.fromEntries(formData.entries()) as AuthFormData[T];
        try {
          setForm(form);
          await props.onSubmit(form);
        } catch (e) {
          const error = e as Error;
          setError(error.message);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Text variant={"heading"} fontSize={32} textAlign="center">
        {title}
      </Text>
      <Text
        variant="body"
        fontSize={"title"}
        textAlign="center"
        mt={2}
        mb={35}
        color="fontTertiary"
      >
        {subtitle}
      </Text>
      {typeof children === "function" ? children(form) : children}
      {error && (
        <Flex bg="errorBg" p={1} mt={2} sx={{ borderRadius: "default" }}>
          <ErrorIcon size={15} color="error" />
          <Text variant="error" ml={1}>
            {error}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

type SubtitleWithActionProps = {
  text: string;
  action: {
    text: string;
    onClick: () => void;
  };
};
function SubtitleWithAction(props: SubtitleWithActionProps) {
  return (
    <>
      {props.text}{" "}
      <Text
        sx={{
          textDecoration: "underline",
          ":hover": { color: "dimPrimary" },
          cursor: "pointer",
        }}
        as="b"
        color="text"
        onClick={props.action.onClick}
      >
        {props.action.text}
      </Text>
    </>
  );
}

type AuthFieldProps = {
  id: string;
  type: string;
  autoFocus?: boolean;
  autoComplete: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  disabled?: boolean;
  inputMode?: string;
  pattern?: string;
  action?: {
    disabled?: boolean;
    component?: JSX.Element;
    onClick?: () => void | Promise<void>;
  };
};
function AuthField(props: AuthFieldProps) {
  return (
    <Field
      type={props.type}
      id={props.id}
      name={props.id}
      data-test-id={props.id}
      autoComplete={props.autoComplete}
      label={props.label}
      autoFocus={props.autoFocus}
      defaultValue={props.defaultValue}
      helpText={props.helpText}
      disabled={props.disabled}
      pattern={props.pattern}
      inputMode={props.inputMode}
      placeholder={props.placeholder}
      required
      action={props.action}
      styles={{
        container: { mt: 2, width: "100%" },
        // label: { fontWeight: "normal" },
        input: {
          p: "12px",
          borderRadius: "default",
          bg: "background",
          boxShadow: "0px 0px 5px 0px #00000019",
        },
      }}
    />
  );
}

type SubmitButtonProps = {
  text: string;
  disabled?: boolean;
  loading?: boolean;
};
function SubmitButton(props: SubmitButtonProps) {
  return (
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
      disabled={props.disabled}
    >
      {props.loading ? <Loading color="static" /> : props.text}
    </Button>
  );
}

async function login(
  form: LoginFormData | MFALoginFormData,
  navigate: NavigateFunction
) {
  try {
    await userstore.login(form);
    Config.set("sessionExpired", false);
    openURL("/");
  } catch (e) {
    if (e instanceof RequestError && e.code === "mfa_required") {
      const { primaryMethod, phoneNumber, secondaryMethod, token } =
        e.data as MFAErrorData;

      if (!primaryMethod)
        throw new Error(
          "Multi-factor is required but the server didn't send a primary MFA method."
        );

      navigate("mfa:code", {
        ...form,
        token,
        selectedMethod: primaryMethod,
        primaryMethod,
        phoneNumber,
        secondaryMethod,
      });
    } else throw e;
  }
}

function openURL(url: string, force?: boolean) {
  const queryParams = getQueryParams();
  const redirect = queryParams?.redirect;
  Config.set("skipInitiation", true);
  hardNavigate(force ? url : redirect || url);
}

function maskEmail(email: string) {
  if (!email) return "";
  const [username, domain] = email.split("@");
  const maskChars = "*".repeat(
    username.substring(2, username.length - 2).length
  );
  return `${username.substring(0, 2)}${maskChars}${username.substring(
    username.length - 2
  )}@${domain}`;
}
