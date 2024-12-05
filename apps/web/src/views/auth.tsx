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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Link, Text } from "@theme-ui/components";
import {
  CheckCircle,
  Loading,
  MfaAuthenticator,
  MfaSms,
  MfaEmail,
  MfaRecoveryCode,
  Icon,
  Warn
} from "../components/icons";
import Field, { FieldProps } from "../components/field";
import { getQueryParams, hardNavigate, makeURL } from "../navigation";
import { store as userstore } from "../stores/user-store";
import { db } from "../common/db";
import Config from "../utils/config";
import { Loader } from "../components/loader";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";
import { useTimer } from "../hooks/use-timer";
import { ErrorText } from "../components/error-text";
import { AuthenticatorType, User } from "@notesnook/core";
import { showLogoutConfirmation } from "../dialogs/confirm";
import { TaskManager } from "../common/task-manager";
import { strings } from "@notesnook/intl";
import { ScrollContainer } from "@notesnook/ui";

type EmailFormData = {
  email: string;
};

type PasswordFormData = EmailFormData & {
  password: string;
};

type MFALoginFormData = {
  code: string;
  method: MFAMethodType;
};

type SignupFormData = EmailFormData &
  PasswordFormData & {
    "confirm-password": string;
  };

type AccountRecoveryFormData = {
  email: string;
};

type MFAFormData = EmailFormData & {
  selectedMethod: MFAMethodType;
  primaryMethod: MFAMethodType;
  code?: string;
  secondaryMethod?: MFAMethodType;
  phoneNumber?: string;
};

type MFAErrorData = {
  primaryMethod: MFAMethodType;
  secondaryMethod?: MFAMethodType;
  phoneNumber?: string;
};

type AuthFormData = {
  "login:email": EmailFormData;
  "login:password": PasswordFormData;
  signup: SignupFormData;
  sessionExpiry: EmailFormData;
  recover: AccountRecoveryFormData;
  "mfa:code": MFAFormData;
  "mfa:select": MFAFormData;
};

type BaseFormData =
  | MFAFormData
  | EmailFormData
  | PasswordFormData
  | AccountRecoveryFormData
  | SignupFormData;

type OpenURLFunction = (
  url: string,
  context?: { authenticated: boolean }
) => void;
type NavigateFunction = <TRoute extends AuthRoutes>(
  route: TRoute,
  formData?: AuthFormData[TRoute]
) => void;
type BaseAuthComponentProps<TRoute extends AuthRoutes> = {
  canSkip?: boolean;
  openURL: OpenURLFunction;
  navigate: NavigateFunction;
  formData?: AuthFormData[TRoute];
};
type AuthRoutes =
  | "sessionExpiry"
  | "login:email"
  | "login:password"
  | "signup"
  | "recover"
  | "mfa:code"
  | "mfa:select";
export type AuthProps = {
  route: AuthRoutes;
  isolated?: boolean;
  canSkip?: boolean;
  openURL?: OpenURLFunction;
};

type AuthComponent<TRoute extends AuthRoutes> = (
  props: BaseAuthComponentProps<TRoute>
) => JSX.Element;

function getRouteComponent<TRoute extends AuthRoutes>(
  route: TRoute
): AuthComponent<TRoute> | undefined {
  switch (route) {
    case "login:email":
      return LoginEmail as AuthComponent<TRoute>;
    case "login:password":
      return LoginPassword as AuthComponent<TRoute>;
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
  "login:email": "/login",
  "login:password": "/login/password",
  "mfa:code": "/login/mfa/code",
  "mfa:select": "/login/mfa/select",
  recover: "/recover",
  sessionExpiry: "/sessionexpired",
  signup: "/signup"
};

const authorizedRoutes: AuthRoutes[] = [
  "login:email",
  "login:password",
  "signup",
  "mfa:code",
  "mfa:select",
  "recover"
];

function Auth(props: AuthProps) {
  return (
    <AuthContainer>
      <HeadlessAuth {...props} />
    </AuthContainer>
  );
}
export default Auth;

export function HeadlessAuth(props: AuthProps) {
  const { openURL = _openURL, isolated } = props;
  const [route, setRoute] = useState(props.route);
  const [isReady, setIsReady] = useState(false);
  const [storedFormData, setStoredFormData] = useState<
    BaseFormData | undefined
  >();
  const Route = useMemo(() => getRouteComponent(route), [route]);
  useEffect(() => {
    if (isolated) return;
    window.history.replaceState({}, "", makeURL(routePaths[route]));
  }, [route, isolated]);

  useEffect(() => {
    db.user.getUser().then((user) => {
      if (user && authorizedRoutes.includes(route) && !isSessionExpired())
        return openURL("/", { authenticated: true });
      performance.mark("load:auth");
      setIsReady(true);
    });
  }, [route, openURL]);

  if (!isReady) return <></>;

  return (
    <ScrollContainer
      className="auth-scroll-container"
      style={{
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
        flex: 1,
        flexShrink: 0
      }}
    >
      {Route && (
        <Route
          openURL={openURL}
          canSkip={props.canSkip}
          navigate={(route, formData) => {
            setStoredFormData(formData);
            setRoute(route);
          }}
          formData={storedFormData}
        />
      )}
    </ScrollContainer>
  );
}

function LoginEmail(props: BaseAuthComponentProps<"login:email">) {
  const { navigate, canSkip = true, openURL } = props;

  return (
    <AuthForm
      type="login:email"
      title={strings.welcomeBack()}
      canSkip={canSkip}
      openURL={openURL}
      subtitle={
        <SubtitleWithAction
          text={strings.dontHaveAccount()}
          action={{ text: strings.signUp(), onClick: () => navigate("signup") }}
        />
      }
      loading={{
        title: strings.verifyingEmail(),
        subtitle: strings.authWait()
      }}
      onSubmit={async (form) => {
        const { primaryMethod, phoneNumber, secondaryMethod } =
          (await userstore.login(form)) as MFAErrorData;

        navigate("mfa:code", {
          email: form.email,
          selectedMethod: primaryMethod,
          primaryMethod,
          phoneNumber,
          secondaryMethod
        });
      }}
    >
      {(form?: EmailFormData) => (
        <>
          {IS_BETA ? (
            <Flex
              bg="background"
              p={2}
              sx={{ borderRadius: "default", alignItems: "start" }}
            >
              <Warn size={16} color="icon-error" />
              <Text variant="body" ml={1}>
                {strings.betaLoginNotice()}
              </Text>
            </Flex>
          ) : null}
          <AuthField
            id="email"
            type="email"
            autoComplete="email"
            label={strings.enterEmailAddress()}
            autoFocus
            defaultValue={form?.email}
          />
          <SubmitButton text={strings.continue()} />
        </>
      )}
    </AuthForm>
  );
}

function LoginPassword(props: BaseAuthComponentProps<"login:password">) {
  const { navigate, formData, openURL } = props;

  if (!formData) {
    openURL("/", { authenticated: false });
    return null;
  }

  return (
    <AuthForm
      type="login:password"
      title={strings.accountPassword()}
      subtitle={strings.accountPassDesc()}
      loadForever
      loading={{
        title: strings.loggingIn(),
        subtitle: strings.authWait()
      }}
      openURL={openURL}
      onSubmit={async (form) => {
        await userstore.login(
          {
            password: form.password,
            email: formData.email
          },
          false,
          Config.get("sessionExpired", false)
        );
        Config.set("sessionExpired", false);
        openURL("/", { authenticated: true });
      }}
    >
      {(form?: PasswordFormData) => (
        <>
          <AuthField
            id="password"
            type="password"
            autoComplete="current-password"
            label={strings.enterPassword()}
            autoFocus
            defaultValue={form?.password}
          />
          <Button
            data-test-id="auth-forgot-password"
            type="button"
            mt={2}
            variant="anchor"
            onClick={() => navigate("recover", { email: formData.email })}
            sx={{ color: "paragraph", alignSelf: "end" }}
          >
            {strings.forgotPassword()}
          </Button>
          <SubmitButton text={strings.loginToYourAccount()} />
        </>
      )}
    </AuthForm>
  );
}

function Signup(props: BaseAuthComponentProps<"signup">) {
  const { navigate, canSkip = true, openURL } = props;

  return (
    <AuthForm
      type="signup"
      title={strings.createAccount()}
      canSkip={canSkip}
      subtitle={
        <SubtitleWithAction
          text={strings.alreadyHaveAccount()}
          action={{
            text: strings.login(),
            onClick: () => navigate("login:email")
          }}
        />
      }
      loading={{
        title: strings.creatingAccount(),
        subtitle: strings.creatingAccountDesc()
      }}
      openURL={openURL}
      onSubmit={async (form) => {
        if (form.password !== form["confirm-password"]) {
          throw new Error(strings.passwordNotMatched());
        }

        await userstore.signup(form);
        openURL("/notes/#/welcome", { authenticated: true });
      }}
    >
      {(form?: SignupFormData) => (
        <>
          <AuthField
            id="email"
            type="email"
            autoComplete="email"
            label={strings.enterEmailAddress()}
            autoFocus
            defaultValue={form?.email}
          />
          <AuthField
            id="password"
            type="password"
            autoComplete="new-password"
            label={strings.newPassword()}
            defaultValue={form?.password}
          />
          <AuthField
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            label={strings.confirmPassword()}
            defaultValue={form?.["confirm-password"]}
          />
          <SubmitButton text={strings.createAccount()} />
          <Text
            mt={4}
            variant="subBody"
            sx={{ fontSize: 13, textAlign: "center" }}
          >
            {strings.signupAgreement[0]()}{" "}
            <Link
              target="_blank"
              rel="noreferrer"
              href="https://notesnook.com/tos"
              sx={{ color: "accent" }}
            >
              {strings.signupAgreement[1]()}
            </Link>{" "}
            {strings.signupAgreement[2]()}{" "}
            <Link
              rel="noreferrer"
              href="https://notesnook.com/privacy"
              sx={{ color: "accent" }}
            >
              {strings.signupAgreement[3]()}
            </Link>
            . {strings.signupAgreement[4]()}
          </Text>
        </>
      )}
    </AuthForm>
  );
}

function SessionExpiry(props: BaseAuthComponentProps<"sessionExpiry">) {
  const { navigate, openURL } = props;
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    (async () => {
      const user = await db.user.getUser();
      if (user && isSessionExpired()) {
        setUser(user);
      } else if (!user) {
        Config.set("sessionExpired", false);
        navigate("login:email");
      } else openURL("/", { authenticated: true });
    })();
  }, [navigate, openURL]);

  return (
    <AuthForm
      type="sessionExpiry"
      title={strings.sessionExpired()}
      subtitle={
        <Flex bg="shade" p={1} sx={{ borderRadius: "default" }}>
          <Text as="span" sx={{ fontSize: "body", color: "accent" }}>
            {strings.sessionExpiredDesc(user?.email as string)}
          </Text>
        </Flex>
      }
      loading={{
        title: strings.loggingIn(),
        subtitle: strings.pleaseWaitLogin()
      }}
      openURL={openURL}
      onSubmit={async () => {
        if (!user) return;

        const { primaryMethod, phoneNumber, secondaryMethod } =
          (await userstore.login(user)) as MFAErrorData;

        navigate("mfa:code", {
          email: user.email,
          selectedMethod: primaryMethod,
          primaryMethod,
          phoneNumber,
          secondaryMethod
        });
      }}
    >
      <AuthField
        id="email"
        type="email"
        autoComplete={"false"}
        label={strings.enterEmailAddress()}
        placeholder={user ? maskEmail(user.email) : undefined}
        autoFocus
        disabled
      />
      <Button
        data-test-id="auth-forgot-password"
        type="button"
        mt={2}
        variant="anchor"
        onClick={() => user && navigate("recover", { email: user.email })}
        sx={{ color: "paragraph", alignSelf: "end" }}
      >
        {strings.forgotPassword()}
      </Button>
      <SubmitButton text={strings.reloginToYourAccount()} />
      <Button
        type="button"
        variant="anchor"
        sx={{
          mt: 5,
          color: "var(--paragraph-error)",
          textDecoration: "none",
          ":hover": {
            color: "var(--paragraph-error)"
          }
        }}
        onClick={async () => {
          if (await showLogoutConfirmation()) {
            await TaskManager.startTask({
              type: "modal",
              title: strings.loggingOut(),
              action: () => db.user.logout(true),
              subtitle: strings.loggingOutDesc()
            });
            navigate("login:email");
          }
        }}
      >
        {strings.logout()}
      </Button>
    </AuthForm>
  );
}

function AccountRecovery(props: BaseAuthComponentProps<"recover">) {
  const { navigate, formData, openURL } = props;
  const [success, setSuccess] = useState<string>();

  return (
    <AuthForm
      type="recover"
      title={strings.accountRecovery()}
      subtitle={
        <SubtitleWithAction
          text={strings.rememberedYourPassword()}
          action={{
            text: strings.login(),
            onClick: () => navigate("login:email")
          }}
        />
      }
      loading={{
        title: strings.sendingRecoveryEmail(),
        subtitle: strings.sendingRecoveryEmailDesc()
      }}
      openURL={openURL}
      onSubmit={async (form) => {
        if (!form.email) {
          setSuccess(undefined);
          return;
        }

        const url = await db.user.recoverAccount(form.email.toLowerCase());
        console.log(url);
        if (IS_TESTING) {
          window.open(url, "_self");
          return;
        }
        setSuccess(strings.recoveryEmailSentDesc());
      }}
    >
      {success ? (
        <>
          <Flex bg="background" p={2} mt={2} sx={{ borderRadius: "default" }}>
            <CheckCircle size={20} color="accent" />
            <Text variant="body" ml={2} sx={{ color: "accent" }}>
              {success}
            </Text>
          </Flex>
          <SubmitButton text={strings.confirmEmail()} />
        </>
      ) : (
        <>
          <AuthField
            id="email"
            type="email"
            autoComplete={"email"}
            label={strings.enterEmailAddress()}
            helpText={strings.accountRecoverHelpText()}
            defaultValue={formData ? formData.email : ""}
            autoFocus
          />
          <SubmitButton text={strings.sendRecoveryEmail()} />
        </>
      )}
    </AuthForm>
  );
}

function getTexts(formData: MFAFormData) {
  return {
    app: {
      subtitle: strings.mfaAuthAppSubtitle(),
      instructions: strings.mfaAuthAppInstructions(),
      selector: strings.mfaAuthAppSelector(),
      label: strings.enterSixDigitCode()
    },
    email: {
      subtitle: strings.mfaEmailSubtitle(),
      instructions: strings.mfaEmailInstructions(),
      selector: strings.mfaEmailSelector(),
      label: strings.enterSixDigitCode()
    },
    sms: {
      subtitle: strings.mfaSmsSubtitle(formData.phoneNumber),
      instructions: strings.mfaSmsInstructions(),
      selector: strings.mfaSmsSelector(),
      label: strings.enterSixDigitCode()
    },
    recoveryCode: {
      subtitle: strings.mfaRecoveryCodeSubtitle(),
      instructions: "",
      selector: strings.mfaRecoveryCodeSelector(),
      label: strings.enterRecoveryCode()
    }
  };
}

function MFACode(props: BaseAuthComponentProps<"mfa:code">) {
  const { navigate, formData, openURL } = props;
  const [isSending, setIsSending] = useState(false);
  const { elapsed, enabled, setEnabled } = useTimer(
    `2fa.${formData?.primaryMethod}`,
    60
  );

  const sendCode = useCallback(
    async (selectedMethod: "sms" | "email") => {
      setIsSending(true);
      try {
        await db.mfa.sendCode(selectedMethod);
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
      !formData.selectedMethod ||
      formData.selectedMethod === "recoveryCode" ||
      formData.selectedMethod === "app"
    )
      return;

    (async function () {
      await sendCode(formData.selectedMethod as "sms" | "email");
    })();
  }, [formData, sendCode]);

  if (!formData) {
    openURL("/", { authenticated: false });
    return null;
  }

  const { selectedMethod } = formData;
  const texts = getTexts(formData)[selectedMethod];

  if (!texts) return null;

  return (
    <AuthForm
      type="mfa:code"
      title={strings["2fa"]()}
      subtitle={texts.subtitle}
      loading={{
        title: strings.verifying2faCode(),
        subtitle: strings.authWait()
      }}
      openURL={openURL}
      onSubmit={async (form) => {
        if (!form.code) throw new Error(strings.coreRequired());

        const loginForm: MFALoginFormData = {
          code: form.code,
          method: formData.selectedMethod
        };
        await userstore.login(loginForm);
        navigate("login:password", {
          email: formData.email,
          // TODO
          password: ""
        });
      }}
    >
      <AuthField
        id="code"
        type={selectedMethod !== "recoveryCode" ? "number" : "text"}
        autoComplete={"one-time-code"}
        label={texts.label}
        autoFocus
        pattern={selectedMethod !== "recoveryCode" ? "[0-9]*" : undefined}
        inputMode={selectedMethod !== "recoveryCode" ? "numeric" : undefined}
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
                      strings.resendCode()
                    ) : (
                      strings.resendCode(elapsed)
                    )}
                  </Text>
                ),
                onClick: async () => {
                  await sendCode(selectedMethod);
                }
              }
            : undefined
        }
      />
      <SubmitButton text={strings.submit()} />
      <Button
        type="button"
        mt={4}
        variant={"anchor"}
        onClick={() => navigate("mfa:select", formData)}
        sx={{ color: "paragraph" }}
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
  icon: Icon;
};
const MFAMethods: MFAMethod[] = [
  { type: "app", title: strings.sendCode(), icon: MfaAuthenticator },
  { type: "sms", title: strings.sendCodeSms(), icon: MfaSms },
  { type: "email", title: strings.sendCodeEmail(), icon: MfaEmail },
  { type: "recoveryCode", title: strings.recoveryCode(), icon: MfaRecoveryCode }
];
function MFASelector(props: BaseAuthComponentProps<"mfa:select">) {
  const { navigate, formData, openURL } = props;
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
    openURL("/", { authenticated: false });
    return null;
  }

  return (
    <AuthForm
      type="mfa:select"
      title={strings.select2faMethod()}
      subtitle={strings.select2faCodeHelpText()}
      loading={{
        title: strings.loggingIn(),
        subtitle: strings.authWait()
      }}
      openURL={openURL}
      onSubmit={async () => {
        const selectedType = MFAMethods[selected];
        formData.selectedMethod = selectedType.type;
        navigate("mfa:code", formData);
      }}
    >
      {MFAMethods.map(
        (method, index) =>
          isValidMethod(method.type) && (
            <Button
              key={method.type}
              type="submit"
              variant={"secondary"}
              mt={2}
              sx={{
                ":first-of-type": { mt: 2 },
                display: "flex",
                bg: "background",
                alignSelf: "stretch",
                alignItems: "center",
                textAlign: "left",
                px: 2
              }}
              onClick={() => setSelected(index)}
            >
              <method.icon
                sx={{
                  bg: selected === index ? "shade" : "border",
                  borderRadius: 100,
                  width: 35,
                  height: 35,
                  mr: 2
                }}
                size={16}
                color={selected === index ? "accent" : "icon"}
              />
              <Text variant={"title"} sx={{ fontWeight: "body" }}>
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
      {/* <Button type="button" mt={4} variant={"anchor"}  sx={{color: "paragraph"}}>
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
  openURL: OpenURLFunction;
  loadForever?: boolean;
  canSkip?: boolean;
  children?:
    | React.ReactNode
    | ((form?: AuthFormData[TType]) => React.ReactNode);
};

export function AuthForm<T extends AuthRoutes>(props: AuthFormProps<T>) {
  const { title, subtitle, children, canSkip, loadForever, openURL } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<AuthFormData[T] | undefined>();

  if (isSubmitting)
    return <Loader title={props.loading.title} text={props.loading.subtitle} />;

  return (
    <Flex
      ref={formRef}
      as="form"
      id="authForm"
      onSubmit={async (e) => {
        if (!formRef.current) return;
        e.preventDefault();

        setError("");
        setIsSubmitting(true);
        const formData = new FormData(formRef.current);
        const form = Object.fromEntries(formData.entries()) as AuthFormData[T];
        try {
          setForm(form);
          await props.onSubmit(form);
          if (!loadForever) setIsSubmitting(false);
        } catch (e) {
          setIsSubmitting(false);
          const error = e as Error;
          if (error.message === "invalid_grant") {
            setError(
              "Login session has expired. Please refresh this page and try logging in again."
            );
            return;
          }
          setError(error.message);
        }
      }}
      sx={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: ["95%", "95%", "45%"],
        alignSelf: "center"
      }}
    >
      <Text variant={"heading"} sx={{ fontSize: 32, textAlign: "center" }}>
        {title}
      </Text>
      <Text
        variant="body"
        mt={2}
        mb={35}
        sx={{
          fontSize: "title",
          textAlign: "center",
          color: "var(--paragraph-secondary)"
        }}
      >
        {subtitle}
      </Text>
      {typeof children === "function" ? children(form) : children}
      {canSkip && (
        <Button
          type="button"
          variant="anchor"
          sx={{
            mt: 5,
            color: "paragraph",
            textDecoration: "none"
          }}
          onClick={() => {
            openURL("/notes/", { authenticated: false });
          }}
        >
          {strings.skipAndGoToApp()}
        </Button>
      )}

      <ErrorText error={error} mt={5} />
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
      <Button
        type="button"
        variant="anchor"
        sx={{
          textDecoration: "underline",
          fontWeight: "bold",
          fontSize: "subtitle",
          color: "paragraph",
          cursor: "pointer"
        }}
        onClick={props.action.onClick}
      >
        {props.action.text}
      </Button>
    </>
  );
}

export function AuthField(props: FieldProps) {
  return (
    <Field
      {...props}
      name={props.name || props.id}
      data-test-id={props["data-test-id"] || props.id}
      required
      sx={{ mt: 2, width: "100%" }}
      styles={{
        // label: { fontWeight: "normal" },
        input: {
          p: "12px",
          borderRadius: "default",
          bg: "background",
          boxShadow: "0px 0px 5px 0px #00000019",
          "::-moz-appearance": "textfield",
          "::-webkit-inner-spin-button": {
            "-webkit-appearance": "none"
          },
          "::-webkit-outer-spin-button": {
            "-webkit-appearance": "none"
          }
        }
      }}
    />
  );
}

type SubmitButtonProps = {
  text: string;
  disabled?: boolean;
  loading?: boolean;
};
export function SubmitButton(props: SubmitButtonProps) {
  return (
    <Button
      data-test-id="submitButton"
      type="submit"
      mt={50}
      variant="accent"
      px={50}
      sx={{
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        display: "flex"
      }}
      disabled={props.disabled}
    >
      {props.loading ? <Loading color="accentForeground" /> : props.text}
    </Button>
  );
}

function _openURL(url: string, _context?: any) {
  const queryParams = getQueryParams();
  const redirect = queryParams?.redirect;
  Config.set("skipInitiation", true);
  hardNavigate(redirect || url);
}

function maskEmail(email: string) {
  if (!email) return "";
  const [username, provider] = email.split("@");
  if (username.length === 1) return `****@${provider}`;
  return email.replace(/(.{1})(.*)(?=@)/, function (gp1, gp2, gp3) {
    for (let i = 0; i < gp3.length; i++) {
      gp2 += "*";
    }
    return gp2;
  });
}

function isSessionExpired() {
  return Config.get("sessionExpired", false);
}
