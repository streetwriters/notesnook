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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext
} from "react";
import { Button, Flex, Link, Text, Box, Label } from "@notesnook/ui";
import {
  CheckCircle,
  Loading,
  MfaAuthenticator,
  MfaSms,
  MfaEmail,
  MfaRecoveryCode,
  ChevronRight,
  ChevronLeft,
  Clock,
  Icon,
  Warn,
  Chat,
  Email,
  RecoveryCode,
  CaretRight
} from "../components/icons";
import Field, { FieldProps } from "../components/field";
import { OtpInput } from "../components/otp-input";
import { getQueryParams, hardNavigate, makeURL } from "../navigation";
import { store as userstore } from "../stores/user-store";
import { db } from "../common/db";
import Config from "../utils/config";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";
import { useTimer } from "../hooks/use-timer";
import { AuthErrorText } from "../components/error-text";
import isEmail from "validator/lib/isEmail";
import { AuthenticatorType, User } from "@notesnook/core";
import { ConfirmDialog, showLogoutConfirmation } from "../dialogs/confirm";
import { TaskManager } from "../common/task-manager";
import { strings } from "@notesnook/intl";
import { ScrollContainer } from "@notesnook/ui";
import {
  authRoutes,
  AuthRoutes,
  isUnauthorizedRoute
} from "../navigation/auth-routes";

type EmailFormData = {
  email: string;
};

type MFALoginFormData = {
  code: string;
  method: MFAMethodType;
};

type LoginFormData = {
  email: string;
  password: string;
};

type SignupFormData = EmailFormData &
  LoginFormData & {
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
  password?: string;
};

type MFAErrorData = {
  primaryMethod: MFAMethodType;
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
  | EmailFormData
  | LoginFormData
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

export const AuthFormContext = createContext<{ error?: string }>({});

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
    window.history.replaceState({}, "", makeURL(authRoutes[route]));
  }, [route, isolated]);

  useEffect(() => {
    db.user.getUser().then((user) => {
      if (user && isUnauthorizedRoute(route) && !isSessionExpired())
        return openURL("/", { authenticated: true });
      performance.mark("load:auth");
      setIsReady(true);
    });
  }, [route]);

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

function Login(props: BaseAuthComponentProps<"login">) {
  const { navigate, canSkip = true, openURL, formData } = props;

  return (
    <AuthForm
      type="login"
      title={strings.loginToYourAccount()}
      canSkip={canSkip}
      openURL={openURL}
      subtitle={
        <SubtitleWithAction
          text={strings.dontHaveAccount()}
          action={{ text: strings.signUp(), onClick: () => navigate("signup") }}
        />
      }
      onSubmit={async (form) => {
        if (!isEmail(form.email)) throw new Error(strings.emailInvalid());

        const result = (await userstore.login(form)) as
          | MFAErrorData
          | undefined;

        if (!result) {
          openURL("/plans", { authenticated: true });
          return;
        }

        navigate("mfa:code", {
          email: form.email,
          password: form.password,
          selectedMethod: result.primaryMethod,
          primaryMethod: result.primaryMethod,
          phoneNumber: result.phoneNumber,
          secondaryMethod: result.secondaryMethod
        });
      }}
    >
      {(form, options) => (
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
            type="text"
            autoComplete="email"
            label={strings.enterEmailAddress()}
            autoFocus
            defaultValue={form?.email ?? formData?.email}
          />
          <AuthField
            id="password"
            type="password"
            autoComplete="current-password"
            label={strings.enterPassword()}
            defaultValue={form?.password ?? formData?.password}
          />
          <Button
            data-test-id="auth-forgot-password"
            type="button"
            variant="new_anchor"
            onClick={() => navigate("recover", { email: form?.email || "" })}
            sx={{
              mt: "spacing4",
              fontSize: "xs",
              color: "paragraph",
              textDecoration: "none",
              alignSelf: "end"
            }}
          >
            {strings.forgotPassword()}
          </Button>
          <SubmitButton
            loading={options?.loading}
            text={options?.loading ? strings.loggingIn() : strings.continue()}
          />
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
      title={"Create an account"}
      canSkip={canSkip}
      showAgreement
      subtitle={
        <SubtitleWithAction
          text={strings.alreadyHaveAccount()}
          action={{
            text: strings.login(),
            onClick: () => navigate("login")
          }}
        />
      }
      openURL={openURL}
      onSubmit={async (form) => {
        if (!isEmail(form.email)) throw new Error(strings.emailInvalid());

        if (form.password !== form["confirm-password"]) {
          throw new Error(strings.passwordNotMatched());
        }

        await userstore.signup(form);
        openURL("/plans", { authenticated: true });
      }}
    >
      {(form, options) => (
        <>
          <AuthField
            id="email"
            type="text"
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
          <SubmitButton
            loading={options?.loading}
            text={
              options?.loading
                ? strings.creatingAccount()
                : strings.createAccount()
            }
          />
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
        navigate("login");
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
            {strings.sessionExpiredDesc(user ? maskEmail(user.email) : "")}
          </Text>
        </Flex>
      }
      openURL={openURL}
      onSubmit={async (form) => {
        if (!user) return;

        const result = (await userstore.login({
          email: user.email,
          password: form.password
        })) as MFAErrorData | undefined;

        Config.set("sessionExpired", false);

        if (!result) {
          openURL("/", { authenticated: true });
          return;
        }

        navigate("mfa:code", {
          email: user.email,
          selectedMethod: result.primaryMethod,
          primaryMethod: result.primaryMethod,
          phoneNumber: result.phoneNumber,
          secondaryMethod: result.secondaryMethod
        });
      }}
    >
      {(_, options) => (
        <>
          <AuthField
            id="email"
            type="email"
            autoComplete={"false"}
            label={strings.enterEmailAddress()}
            placeholder={user ? maskEmail(user.email) : undefined}
            autoFocus
            disabled
            required={false}
          />
          <AuthField
            id="password"
            type="password"
            autoComplete={"false"}
            label={strings.enterPassword()}
            autoFocus
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
          <SubmitButton
            loading={options?.loading}
            text={
              options?.loading
                ? strings.loggingIn()
                : strings.reloginToYourAccount()
            }
          />
          <Button
            type="button"
            variant="anchor"
            sx={{
              mt: 5,
              color: "paragraph-error",
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
                navigate("login");
              }
            }}
          >
            {strings.logout()}
          </Button>
        </>
      )}
    </AuthForm>
  );
}

function RecoverySuccessCard({ email }: { email: string }) {
  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: "spacing6",
          p: "spacing7",
          bg: "background",
          border: "1px solid var(--border)",
          borderRadius: "radius4",
          boxShadow: "0px 4px 25px 0px rgba(0,0,0,0.04)"
        }}
      >
        <CheckCircle size={40} color="accent" />
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
            gap: "spacing3"
          }}
        >
          <Text
            sx={{
              fontSize: "md",
              fontWeight: "bold",
              color: "heading",
              textAlign: "center"
            }}
          >
            Recovery email sent!
          </Text>
          <Text
            sx={{
              fontSize: "sm",
              color: "paragraph",
              textAlign: "center",
              lineHeight: "1.4",
              fontWeight: 400
            }}
          >
            We&apos;ve sent instructions to recover your account to{" "}
            <Text as="span" sx={{ color: "accent" }}>
              {email}
            </Text>
          </Text>
        </Flex>
        <Box
          sx={{
            width: "100%",
            height: "1px",
            bg: "separator"
          }}
        />
        <Flex sx={{ gap: "spacing3", alignItems: "flex-start" }}>
          <Flex
            sx={{
              bg: "background-secondary",
              borderRadius: "default",
              width: 30,
              height: 30,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Email size={15} color="icon" />
          </Flex>
          <Text
            sx={{
              fontSize: "sm",
              color: "paragraph",
              lineHeight: "1.4",
              flex: "1 1 auto"
            }}
          >
            Please check your inbox and follow the instructions to recover your
            account.
          </Text>
        </Flex>
      </Flex>
      <SubmitButton text={strings.resendEmail()} />
    </>
  );
}

function AccountRecovery(props: BaseAuthComponentProps<"recover">) {
  const { navigate, formData, openURL } = props;
  const [recoveryEmail, setRecoveryEmail] = useState<string>();

  return (
    <AuthForm
      type="recover"
      title={recoveryEmail ? "" : strings.accountRecovery()}
      subtitle={
        recoveryEmail ? (
          <></>
        ) : (
          <>
            <Text
              sx={{
                fontSize: "sm",
                color: "paragraph"
              }}
            >
              {strings.accountRecoverHelpText()}
            </Text>{" "}
            <br />
            <Text
              sx={{
                fontSize: "sm",
                color: "paragraph-secondary"
              }}
            >
              <SubtitleWithAction
                text={strings.rememberedYourPassword()}
                action={{
                  text: strings.login(),
                  onClick: () => navigate("login")
                }}
              />
            </Text>
          </>
        )
      }
      openURL={openURL}
      onSubmit={async (form) => {
        if (!form.email) {
          setRecoveryEmail(undefined);
          return;
        }

        if (!isEmail(form.email)) throw new Error(strings.emailInvalid());

        const url = await db.user.recoverAccount(form.email.toLowerCase());
        console.log(url);
        if (IS_TESTING) {
          window.open(url, "_self");
          return;
        }
        setRecoveryEmail(form.email);
      }}
    >
      {recoveryEmail ? (
        <RecoverySuccessCard email={recoveryEmail} />
      ) : (
        (_, options) => (
          <>
            <AuthField
              id="email"
              type="text"
              autoComplete={"email"}
              label={strings.enterEmailAddress()}
              defaultValue={formData ? formData.email : ""}
              autoFocus
            />
            <SubmitButton
              loading={options?.loading}
              text={
                options?.loading
                  ? strings.sendingRecoveryEmail()
                  : strings.sendRecoveryEmail()
              }
            />
          </>
        )
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
  const [otpValue, setOtpValue] = useState("");
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
      title={
        selectedMethod === "email"
          ? "Check your email"
          : selectedMethod === "sms"
          ? "Check your phone"
          : selectedMethod === "recoveryCode"
          ? "Recovery code"
          : "Authenticator app"
      }
      subtitle={texts.subtitle}
      openURL={openURL}
      onSubmit={async (form) => {
        const code = selectedMethod !== "recoveryCode" ? otpValue : form.code;
        if (!code || code.length < (selectedMethod !== "recoveryCode" ? 6 : 1))
          throw new Error(strings.twoFactorCodeRequired());

        const loginForm: MFALoginFormData = {
          code,
          method: formData.selectedMethod
        };
        await userstore.login(loginForm);
        openURL("/plans", { authenticated: true });
      }}
    >
      {(_, options) => (
        <>
          {selectedMethod !== "recoveryCode" ? (
            <Flex sx={{ flexDirection: "column", gap: "spacing6" }}>
              <Label
                sx={{
                  fontFamily: "body",
                  fontSize: "sm",
                  color: "label",
                  fontWeight: 400
                }}
              >
                Confirmation code
              </Label>
              <OtpInput
                length={6}
                value={otpValue}
                onChange={setOtpValue}
                autoFocus
              />
            </Flex>
          ) : (
            <AuthField id="code" type="text" label={texts.label} autoFocus />
          )}
          <SubmitButton
            loading={options?.loading}
            text={options?.loading ? "Verifying" : strings.submit()}
          />
          <Flex
            sx={{
              flexDirection: "column",
              my: "spacing7",
              gap: "spacing4"
            }}
          >
            {(selectedMethod === "sms" || selectedMethod === "email") && (
              <>
                <Flex
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "background-secondary",
                    p: "spacing5",
                    borderRadius: "radius2"
                  }}
                >
                  <Flex sx={{ alignItems: "center", gap: "10px" }}>
                    <Flex
                      sx={{
                        bg: "background-tertiary",
                        borderRadius: "5px",
                        width: 32,
                        height: 32,
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Clock size={15} color="icon" />
                    </Flex>
                    <Flex sx={{ flexDirection: "column" }}>
                      <Text
                        sx={{
                          fontSize: "sm",
                          fontWeight: 500,
                          color: "heading"
                        }}
                      >
                        {"Didn't receive code?"}
                      </Text>
                      {!enabled && (
                        <Text
                          sx={{
                            color: "paragraph",
                            fontSize: "xs",
                            fontWeight: 400
                          }}
                        >
                          {`${strings.resendCodeWait()} `}
                          <Text as="span" sx={{ color: "accent" }}>
                            {elapsed}s
                          </Text>
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                  <Button
                    type="button"
                    variant="anchor"
                    disabled={isSending || !enabled}
                    onClick={() => sendCode(selectedMethod as "sms" | "email")}
                    sx={{
                      fontSize: "xs",
                      fontWeight: 500,
                      color:
                        enabled && !isSending
                          ? "accent"
                          : "paragraph-secondary",
                      textDecoration: "none"
                    }}
                  >
                    {isSending ? <Loading size={18} /> : strings.resendCode()}
                  </Button>
                </Flex>
              </>
            )}

            <Button
              type="button"
              variant="secondary"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: "spacing5",
                textAlign: "left",
                borderRadius: "radius2"
              }}
              onClick={() => navigate("mfa:select", formData)}
            >
              <Flex sx={{ alignItems: "center", gap: "10px" }}>
                <Flex
                  sx={{
                    bg: "background-tertiary",
                    borderRadius: "5px",
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  {selectedMethod === "email" ? (
                    <MfaEmail size={16} color="icon" />
                  ) : selectedMethod === "sms" ? (
                    <MfaSms size={16} color="icon" />
                  ) : selectedMethod === "app" ? (
                    <MfaAuthenticator size={16} color="icon" />
                  ) : (
                    <MfaRecoveryCode size={16} color="icon" />
                  )}
                </Flex>
                <Text
                  sx={{ fontWeight: 500, fontSize: "sm", color: "heading" }}
                >
                  {texts.selector}
                </Text>
              </Flex>
              <CaretRight size={13} color="icon" sx={{ flexShrink: 0 }} />
            </Button>
          </Flex>
        </>
      )}
    </AuthForm>
  );
}

type MFAMethodType = AuthenticatorType | "recoveryCode";
type MFAMethod = {
  type: MFAMethodType;
  title: string;
  icon: Icon;
  description: string;
};
const MFAMethods: MFAMethod[] = [
  {
    type: "app",
    title: strings.sendCode(),
    icon: MfaAuthenticator,
    description: "Use the authenticator app"
  },
  {
    type: "sms",
    title: strings.sendCodeSms(),
    icon: Chat,
    description: "Text message to my registered number"
  },
  {
    type: "email",
    title: strings.sendCodeEmail(),
    icon: Email,
    description: "Verify via registered inbox"
  },
  {
    type: "recoveryCode",
    title: strings.recoveryCode(),
    icon: RecoveryCode,
    description: "Use my original emergency key"
  }
];
function MFASelector(props: BaseAuthComponentProps<"mfa:select">) {
  const { navigate, formData, openURL } = props;
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
      openURL={openURL}
      onSubmit={async () => {}}
    >
      {MFAMethods.map(
        (method) =>
          isValidMethod(method.type) && (
            <Button
              key={method.type}
              type="button"
              variant="secondary"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bg: "background-secondary",
                alignSelf: "stretch",
                p: "spacing5",
                gap: "20px",
                borderRadius: "10px",
                ":not(:first-of-type)": { mt: "10px" },
                textAlign: "left"
              }}
              onClick={() => {
                formData.selectedMethod = method.type;
                navigate("mfa:code", formData);
              }}
            >
              <Flex
                sx={{
                  alignItems: "center",
                  gap: "10px",
                  flex: "1 1 auto",
                  minWidth: 0
                }}
              >
                <Flex
                  sx={{
                    bg: "background-tertiary",
                    borderRadius: "radius1",
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <method.icon size={15} color="icon" />
                </Flex>
                <Flex
                  sx={{
                    flexDirection: "column",
                    gap: "spacing3"
                  }}
                >
                  <Text
                    sx={{
                      fontWeight: 500,
                      color: "heading",
                      fontSize: "sm"
                    }}
                  >
                    {method.title}
                  </Text>
                  <Text
                    sx={{
                      fontWeight: 400,
                      color: "paragraph",
                      fontSize: "xs"
                    }}
                  >
                    {method.description}
                  </Text>
                </Flex>
              </Flex>
              <CaretRight size={13} />
            </Button>
          )
      )}
    </AuthForm>
  );
}

// function MFAMethodSelector(params) {}

export type AuthFormContainerProps<
  TType extends string,
  TFormData extends Record<TType, Record<string, any>>
> = {
  testId?: string;
  title: string;
  subtitle: string | JSX.Element;
  // loading: { title: string; subtitle: string };
  type: TType;
  onSubmit: (form: TFormData[TType]) => Promise<void>;
  openURL?: OpenURLFunction;
  loadForever?: boolean;
  canSkip?: boolean;
  showAgreement?: boolean;
  onBack?: () => void;
  children?:
    | React.ReactNode
    | ((
        form?: TFormData[TType],
        options?: { loading?: boolean }
      ) => React.ReactNode);
};

function AuthForm<T extends AuthRoutes>(
  props: AuthFormContainerProps<T, AuthFormData>
) {
  return <AuthFormContainer {...props} />;
}

export function AuthFormContainer<
  TType extends string,
  TFormData extends Record<TType, Record<string, any>>
>(props: AuthFormContainerProps<TType, TFormData>) {
  const {
    title,
    subtitle,
    children,
    canSkip,
    loadForever,
    openURL,
    showAgreement,
    onBack
  } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<TFormData[TType] | undefined>();

  // if (isSubmitting)
  //   return <Loader title={props.loading.title} text={props.loading.subtitle} />;

  return (
    <AuthFormContext.Provider value={{ error }}>
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
          const form = Object.fromEntries(
            formData.entries()
          ) as TFormData[TType];
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
          alignItems: "left",
          width: ["95%", "95%", "65%"],
          maxWidth: "500px",
          alignSelf: "center",
          mt: 100
        }}
      >
        {onBack && (
          <Button
            type="button"
            onClick={onBack}
            sx={{
              background: "background",
              borderRadius: "radius2",
              display: "flex",
              alignItems: "center",
              gap: "spacing3",
              px: "spacing6",
              py: "spacing5",
              alignSelf: "flex-start",
              mb: "spacing9",
              border: "1px solid var(--border)"
            }}
          >
            <ChevronLeft size={14} color="icon" />
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 600,
                color: "heading",
                lineHeight: "100%"
              }}
            >
              {strings.goBack()}
            </Text>
          </Button>
        )}
        <Flex
          sx={{
            mb: "spacing13",
            alignItems: "center",
            gap: "spacing4"
          }}
        >
          <svg
            style={{
              borderRadius: "default",
              height: 30,
              width: 30,
              alignSelf: "center"
            }}
          >
            <use href="#full-logo" />
          </svg>
          <Text
            sx={{
              fontSize: "2xl",
              fontWeight: 600,
              color: "heading"
            }}
          >
            Notesnook
          </Text>
        </Flex>
        <Text
          sx={{
            fontSize: "xl",
            textAlign: "left",
            fontWeight: 600,
            color: "heading"
          }}
        >
          {title}
        </Text>
        <Text
          sx={{
            mt: "spacing3",
            mb: "spacing7",
            fontSize: "sm",
            textAlign: "left",
            color: "paragraph",
            fontWeight: 400
          }}
        >
          {subtitle}
        </Text>
        {typeof children === "function"
          ? children(form, { loading: isSubmitting })
          : children}

        {canSkip && openURL && (
          <Button
            type="button"
            variant="new_bordered"
            sx={{ width: "100%", mt: "spacing4" }}
            onClick={() => {
              openURL("/notes/", { authenticated: false });
            }}
          >
            {strings.skipAndGoToApp()}
          </Button>
        )}
        {showAgreement && (
          <Text
            mt={4}
            sx={{
              color: "paragraph",
              fontSize: "xs",
              textAlign: "center",
              fontWeight: 400,
              lineHeight: "150%",
              mt: "auto",
              mb: "spacing11"
            }}
          >
            {strings.signupAgreement[0]()}{" "}
            <Link
              target="_blank"
              rel="noreferrer"
              href="https://notesnook.com/tos"
              sx={{
                fontWeight: 600,
                color: "accent",
                textDecoration: "none"
              }}
            >
              {strings.signupAgreement[1]()}
            </Link>{" "}
            {strings.signupAgreement[2]()}{" "}
            <Link
              target="_blank"
              rel="noreferrer"
              href="https://notesnook.com/privacy"
              sx={{
                fontWeight: 600,
                color: "accent",
                textDecoration: "none"
              }}
            >
              {strings.signupAgreement[3]()}
            </Link>{" "}
            {strings.signupAgreement[4]()}
          </Text>
        )}
      </Flex>
    </AuthFormContext.Provider>
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
          fontWeight: 600,
          fontSize: "sm",
          color: "accent",
          cursor: "pointer",
          textDecoration: "none"
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
      required
      {...props}
      name={props.name || props.id}
      data-test-id={props["data-test-id"] || props.id}
      sx={{ mt: 2, width: "100%", gap: "spacing3" }}
      styles={{
        label: {
          fontSize: "xs",
          fontWeight: 400,
          color: "label"
        },
        input: {
          color: "placeholder",
          fontSize: "xs",
          borderRadius: "radius2",
          outline: 0,
          bg: "background-secondary",
          paddingY: "spacing6",
          paddingX: "spacing4",
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
  const { error } = useContext(AuthFormContext);
  return (
    <>
      <AuthErrorText error={error} sx={{ mt: "spacing4", p: 0 }} />
      <Button
        data-test-id="submitButton"
        type="submit"
        variant="new_accent"
        sx={{
          marginTop: "spacing8",
          width: "100%"
        }}
        disabled={props.loading || props.disabled}
      >
        {props.loading ? (
          <Loading color="accentForeground" size={15} sx={{ mr: "spacing6" }} />
        ) : null}
        {props.text}
      </Button>
    </>
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
