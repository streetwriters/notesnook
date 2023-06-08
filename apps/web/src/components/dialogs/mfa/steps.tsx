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

import React, {
  PropsWithChildren,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Text, Flex, Button, Box } from "@theme-ui/components";
import { useSessionState } from "../../../hooks/use-session-state";
import {
  Loading,
  MfaAuthenticator,
  MfaEmail,
  MfaSms,
  Download,
  Print,
  Copy,
  Refresh,
  Checkmark
} from "../../icons";
import Field from "../../field";
import { exportToPDF } from "../../../common/export";
import { useTimer } from "../../../hooks/use-timer";
import { phone } from "phone";
import { db } from "../../../common/db";
import FileSaver from "file-saver";
import * as clipboard from "clipboard-polyfill/text";
import { ReactComponent as MFA } from "../../../assets/mfa.svg";
import { ReactComponent as Fallback2FA } from "../../../assets/fallback2fa.svg";
import {
  Authenticator,
  AuthenticatorType,
  StepComponent,
  SubmitCodeFunction,
  StepComponentProps,
  OnNextFunction
} from "./types";
import { showMultifactorDialog } from "../../../common/dialog-controller";
const QRCode = React.lazy(
  () => import("../../../re-exports/react-qrcode-logo")
);

export type Steps = typeof steps;
export type FallbackSteps = typeof fallbackSteps;
export type StepKeys = keyof Steps; // "choose" | "setup" | "recoveryCodes" | "finish";
export type FallbackStepKeys = "choose" | "setup" | "finish";

export type Step<
  T extends OnNextFunction = AuthenticatorTypeOnNext | AuthenticatorOnNext
> = {
  title?: string;
  description?: string;
  component?: StepComponent<T>;
  next?: StepKeys;
  cancellable?: boolean;
};
export type FallbackStep<
  T extends OnNextFunction =
    | AuthenticatorTypeOnNext
    | AuthenticatorOnNext
    | OnNextFunction
> = Step<T> & {
  next?: FallbackStepKeys;
};

type AuthenticatorSelectorProps =
  StepComponentProps<AuthenticatorTypeOnNext> & {
    authenticator: AuthenticatorType;
    isFallback?: boolean;
  };

type VerifyAuthenticatorFormProps = PropsWithChildren<{
  codeHelpText: string;
  onSubmitCode: SubmitCodeFunction;
}>;

type SetupAuthenticatorProps = { onSubmitCode: SubmitCodeFunction };

const defaultAuthenticators: AuthenticatorType[] = ["app", "sms", "email"];
const Authenticators: Authenticator[] = [
  {
    type: "app",
    title: "Set up using an Authenticator app",
    subtitle:
      "Use an authenticator app like Aegis or Raivo Authenticator to get the authentication codes.",
    icon: MfaAuthenticator,
    recommended: true
  },
  {
    type: "sms",
    title: "Set up using SMS",
    subtitle: "Notesnook will send you an SMS text with the 2FA code at login.",
    icon: MfaSms
  },
  {
    type: "email",
    title: "Set up using Email",
    subtitle: "Notesnook will send you the 2FA code on your email at login.",
    icon: MfaEmail
  }
];
export type AuthenticatorOnNext = (authenticator: Authenticator) => void;
export type AuthenticatorTypeOnNext = (type: AuthenticatorType) => void;

export const steps = {
  choose: (): Step<AuthenticatorOnNext> => ({
    title: "Protect your notes by enabling 2FA",
    description: "Choose how you want to receive your authentication codes.",
    component: ({ onNext }) => (
      <ChooseAuthenticator
        onNext={onNext}
        authenticators={defaultAuthenticators}
      />
    ),
    next: "setup",
    cancellable: true
  }),
  setup: (authenticator: Authenticator): Step<AuthenticatorTypeOnNext> => ({
    title: authenticator.title,
    description: authenticator.subtitle,
    next: "recoveryCodes",
    component: ({ onNext }) => (
      <AuthenticatorSelector
        onNext={onNext}
        authenticator={authenticator.type}
      />
    ),
    cancellable: true
  }),
  recoveryCodes: (
    authenticatorType: AuthenticatorType
  ): Step<AuthenticatorTypeOnNext> => ({
    title: "Save your recovery codes",
    description: `If you lose access to your ${
      authenticatorType === "email"
        ? "email"
        : authenticatorType === "sms"
        ? "phone"
        : "auth app"
    }, you can login to Notesnook using your recovery codes. Each code can only be used once!`,
    component: ({ onNext, onClose, onError }) => (
      <BackupRecoveryCodes
        onClose={onClose}
        onNext={onNext}
        onError={onError}
        authenticatorType={authenticatorType}
      />
    ),
    next: "finish"
  }),
  finish: (
    authenticatorType: AuthenticatorType
  ): Step<AuthenticatorTypeOnNext> => ({
    component: ({ onNext, onClose, onError }) => (
      <TwoFactorEnabled
        onClose={onClose}
        onNext={onNext}
        onError={onError}
        authenticatorType={authenticatorType}
      />
    )
  })
} as const;

export const fallbackSteps = {
  choose: (
    primaryMethod: AuthenticatorType
  ): FallbackStep<AuthenticatorOnNext> => ({
    title: "Add a fallback 2FA method",
    description:
      "A fallback method helps you get your 2FA codes on an alternative device in case you lose your primary device.",
    component: ({ onNext }) => (
      <ChooseAuthenticator
        onNext={onNext}
        authenticators={defaultAuthenticators.filter(
          (i) => i !== primaryMethod
        )}
      />
    ),
    next: "setup",
    cancellable: true
  }),
  setup: (
    authenticator: Authenticator
  ): FallbackStep<AuthenticatorTypeOnNext> => ({
    title: authenticator.title,
    description: authenticator.subtitle,
    next: "finish",
    cancellable: true,
    component: ({ onNext }) => (
      <AuthenticatorSelector
        onNext={onNext}
        authenticator={authenticator.type}
        isFallback
      />
    )
  }),
  finish: (
    fallbackMethod: AuthenticatorType,
    primaryMethod: AuthenticatorType
  ): FallbackStep<OnNextFunction> => ({
    component: ({ onNext, onClose }) => (
      <Fallback2FAEnabled
        onNext={onNext}
        onClose={onClose}
        primaryMethod={primaryMethod}
        fallbackMethod={fallbackMethod}
      />
    )
  })
} as const;

type ChooseAuthenticatorProps = StepComponentProps<AuthenticatorOnNext> & {
  authenticators: AuthenticatorType[];
};

function ChooseAuthenticator(props: ChooseAuthenticatorProps) {
  const [selected, setSelected] = useSessionState("selectedAuthenticator", 0);
  const { authenticators, onNext } = props;
  const filteredAuthenticators = authenticators
    .map((a) => Authenticators.find((auth) => auth.type === a))
    .filter((a) => !!a) as Authenticator[];

  return (
    <Flex
      as="form"
      id="2faForm"
      sx={{ overflow: "hidden", flex: 1, flexDirection: "column" }}
      onSubmit={(e) => {
        e.preventDefault();
        const authenticator = filteredAuthenticators[selected];
        onNext(authenticator);
      }}
    >
      {filteredAuthenticators.map((auth, index) => (
        <Button
          key={auth.type}
          type="button"
          variant={"secondary"}
          mt={2}
          sx={{
            ":first-of-type": { mt: 2 },
            display: "flex",
            justifyContent: "start",
            alignItems: "start",
            textAlign: "left",
            bg: "transparent",
            px: 0
          }}
          onClick={() => setSelected(index)}
        >
          <auth.icon
            className="2fa-icon"
            sx={{
              bg: selected === index ? "shade" : "bgSecondary",
              borderRadius: 100,
              width: 35,
              height: 35,
              mr: 2
            }}
            size={16}
            color={selected === index ? "primary" : "text"}
          />
          <Text variant={"title"} sx={{ fontWeight: "body" }}>
            {auth.title}{" "}
            {auth.recommended ? (
              <Text
                as="span"
                variant={"subBody"}
                bg="shade"
                px={1}
                sx={{ borderRadius: "default", color: "primary" }}
              >
                Recommended
              </Text>
            ) : (
              false
            )}
            <Text as="div" variant="body" mt={1} sx={{ fontWeight: "normal" }}>
              {auth.subtitle}
            </Text>
          </Text>
        </Button>
      ))}
    </Flex>
  );
}

function AuthenticatorSelector(props: AuthenticatorSelectorProps) {
  const { authenticator, isFallback, onNext, onError } = props;
  const onSubmitCode: SubmitCodeFunction = useCallback(
    async (code) => {
      try {
        if (isFallback) await db.mfa?.enableFallback(authenticator, code);
        else await db.mfa?.enable(authenticator, code);
        onNext(authenticator);
      } catch (e) {
        const error = e as Error;
        onError && onError(error.message);
      }
    },
    [authenticator, onError, onNext, isFallback]
  );

  return authenticator === "app" ? (
    <SetupAuthenticatorApp onSubmitCode={onSubmitCode} />
  ) : authenticator === "email" ? (
    <SetupEmail onSubmitCode={onSubmitCode} />
  ) : authenticator === "sms" ? (
    <SetupSMS onSubmitCode={onSubmitCode} />
  ) : null;
}

function SetupAuthenticatorApp(props: SetupAuthenticatorProps) {
  const { onSubmitCode } = props;
  const [authenticatorDetails, setAuthenticatorDetails] = useState({
    sharedKey: null,
    authenticatorUri: null
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async function () {
      setAuthenticatorDetails(await db.mfa?.setup("app"));
    })();
  }, []);

  return (
    <VerifyAuthenticatorForm
      codeHelpText={
        "After scanning the QR code image, the app will display a code that you can enter below."
      }
      onSubmitCode={onSubmitCode}
    >
      <Text variant={"body"}>
        Scan the QR code below with your authenticator app.
      </Text>
      <Box sx={{ alignSelf: "center" }}>
        {authenticatorDetails.authenticatorUri ? (
          <Suspense fallback={<Loading />}>
            <QRCode
              value={authenticatorDetails.authenticatorUri}
              ecLevel={"M"}
              size={150}
            />
          </Suspense>
        ) : (
          <Loading />
        )}
      </Box>
      <Text variant={"subBody"}>
        {`If you can't scan the QR code above, enter this text instead (spaces
        don't matter):`}
      </Text>
      <Flex
        bg="bgSecondary"
        mt={2}
        sx={{ borderRadius: "default", alignItems: "center" }}
        p={1}
      >
        <Text
          className="selectable"
          ml={1}
          sx={{
            flex: 1,
            overflowWrap: "anywhere",
            color: "text",
            fontSize: "body",
            fontFamily: "monospace"
          }}
        >
          {authenticatorDetails.sharedKey ? (
            authenticatorDetails.sharedKey
          ) : (
            <Loading />
          )}
        </Text>
        <Button
          type="button"
          variant="secondary"
          sx={{ display: "flex", alignItems: "center" }}
          onClick={async () => {
            if (!authenticatorDetails.sharedKey) return;
            await navigator.clipboard.writeText(authenticatorDetails.sharedKey);
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 2500);
          }}
        >
          {copied ? <Checkmark size={15} /> : <Copy size={15} />}
        </Button>
      </Flex>
    </VerifyAuthenticatorForm>
  );
}

function SetupEmail(props: SetupAuthenticatorProps) {
  const { onSubmitCode } = props;
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const { elapsed, enabled, setEnabled } = useTimer(`2fa.email`, 60);
  const [email, setEmail] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      if (!db.user) return;
      const { email } = await db.user.getUser();
      setEmail(email);
    })();
  }, []);

  return (
    <VerifyAuthenticatorForm
      codeHelpText={
        "You will receive a 2FA code on your email address which you can enter below"
      }
      onSubmitCode={onSubmitCode}
    >
      <Flex
        mt={2}
        bg="bgSecondary"
        sx={{
          borderRadius: "default",
          overflowWrap: "anywhere",
          alignItems: "center"
        }}
      >
        <Text
          ml={2}
          sx={{ flex: 1, fontSize: "subtitle", fontFamily: "monospace" }}
        >
          {email}
        </Text>
        <Button
          type="button"
          variant={"secondary"}
          sx={{ p: 2, m: 0, alignSelf: "center" }}
          disabled={isSending || !enabled}
          onClick={async () => {
            setIsSending(true);
            try {
              await db.mfa?.setup("email");
              setEnabled(false);
            } catch (e) {
              const error = e as Error;
              console.error(error);
              setError(error.message);
            } finally {
              setIsSending(false);
            }
          }}
        >
          {isSending ? (
            <Loading size={18} />
          ) : enabled ? (
            `Send code`
          ) : (
            `Resend (${elapsed})`
          )}
        </Button>
      </Flex>
      {error ? (
        <Text
          variant={"error"}
          bg="errorBg"
          p={1}
          sx={{ borderRadius: "default" }}
          mt={1}
        >
          {error}
        </Text>
      ) : null}
    </VerifyAuthenticatorForm>
  );
}

function SetupSMS(props: SetupAuthenticatorProps) {
  const { onSubmitCode } = props;
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const { elapsed, enabled, setEnabled } = useTimer(`2fa.sms`, 60);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <VerifyAuthenticatorForm
      codeHelpText={
        "You will receive a 2FA code on your phone number which you can enter below"
      }
      onSubmitCode={onSubmitCode}
    >
      <Field
        inputRef={inputRef}
        id="phone-number"
        name="phone-number"
        helpText="Authentication codes will be sent to this number"
        label="Phone number"
        sx={{ mt: 2 }}
        autoFocus
        required
        styles={{
          input: { flex: 1 }
        }}
        placeholder={"+1234567890"}
        onChange={() => {
          const number = inputRef.current?.value;
          if (!number) return setError("");
          const validationResult = phone(number);

          if (validationResult.isValid) {
            setPhoneNumber(validationResult.phoneNumber);
            setError("");
          } else {
            setPhoneNumber("");
            setError("Please enter a valid phone number with country code.");
          }
        }}
        action={{
          disabled: error || isSending || !enabled,
          component: (
            <Text variant={"body"}>
              {isSending ? (
                <Loading size={18} />
              ) : enabled ? (
                `Send code`
              ) : (
                `Resend (${elapsed})`
              )}
            </Text>
          ),
          onClick: async () => {
            if (!phoneNumber) {
              setError("Please provide a phone number.");
              return;
            }

            setIsSending(true);
            try {
              await db.mfa?.setup("sms", phoneNumber);
              setEnabled(false);
            } catch (e) {
              const error = e as Error;
              console.error(error);
              setError(error.message);
            } finally {
              setIsSending(false);
            }
          }
        }}
      />
      {error ? (
        <Text
          variant={"error"}
          bg="errorBg"
          p={1}
          sx={{ borderRadius: "default" }}
          mt={1}
        >
          {error}
        </Text>
      ) : null}
    </VerifyAuthenticatorForm>
  );
}

function BackupRecoveryCodes(props: TwoFactorEnabledProps) {
  const { onNext, onError } = props;
  const [codes, setCodes] = useState<string[]>([]);
  const recoveryCodesRef = useRef<HTMLDivElement>(null);
  const generate = useCallback(async () => {
    onError && onError("");
    try {
      const codes = await db.mfa?.codes();
      if (codes) setCodes(codes);
    } catch (e) {
      const error = e as Error;
      onError && onError(error.message);
    }
  }, [onError]);

  useEffect(() => {
    (async function () {
      await generate();
    })();
  }, [generate]);

  const actions = useMemo(
    () => [
      {
        title: "Print",
        icon: Print,
        action: async () => {
          if (!recoveryCodesRef.current) return;
          await exportToPDF(
            "Notesnook 2FA Recovery Codes",
            recoveryCodesRef.current.outerHTML
          );
        }
      },
      {
        title: "Copy",
        icon: Copy,
        action: async () => {
          await clipboard.writeText(codes.join("\n"));
          const button = document.getElementById("btn-copy");
          if (!button) return;

          const buttonText = button.querySelector(".title");
          if (!buttonText) return;

          buttonText.innerHTML = "Copied!";
          setTimeout(() => {
            buttonText.innerHTML = "Copy";
          }, 2500);
        }
      },
      {
        title: "Download",
        icon: Download,
        action: () => {
          FileSaver.saveAs(
            new Blob([Buffer.from(codes.join("\n"))]),
            `notesnook-recovery-codes.txt`
          );
        }
      },
      { title: "Regenerate", icon: Refresh, action: generate }
    ],
    [codes, generate]
  );

  return (
    <Flex
      as="form"
      id="2faForm"
      onSubmit={(e) => {
        e.preventDefault();
        onNext(props.authenticatorType);
      }}
      sx={{ flexDirection: "column" }}
    >
      <Box
        className="selectable"
        ref={recoveryCodesRef}
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          bg: "bgSecondary",
          p: 2,
          gap: 1,
          columnGap: 2,
          borderRadius: "default"
        }}
      >
        {codes.map((code) => (
          <Text
            key={code}
            className="selectable"
            as="code"
            variant={"body"}
            sx={{
              fontFamily: "monospace",
              textAlign: "center",
              fontWeight: "body",
              color: "text"
            }}
          >
            {code}
          </Text>
        ))}
      </Box>
      <Flex sx={{ justifyContent: "start", alignItems: "center", mt: 2 }}>
        {actions.map((action) => (
          <Button
            key={action.title}
            id={`btn-${action.title.toLowerCase()}`}
            type="button"
            variant="secondary"
            mr={1}
            py={1}
            sx={{ display: "flex", alignItems: "center" }}
            onClick={action.action}
          >
            <action.icon size={15} sx={{ mr: "2px" }} />
            <span className="title">{action.title}</span>
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}

type TwoFactorEnabledProps = StepComponentProps<AuthenticatorTypeOnNext> & {
  authenticatorType: AuthenticatorType;
};
function TwoFactorEnabled(props: TwoFactorEnabledProps) {
  return (
    <Flex
      mb={2}
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <MFA width={120} />
      <Text
        variant={"heading"}
        mt={2}
        sx={{ fontSize: "subheading", textAlign: "center" }}
      >
        Two-factor authentication enabled!
      </Text>
      <Text
        variant={"body"}
        mt={1}
        sx={{ textAlign: "center", color: "fontTertiary" }}
      >
        Your account is now 100% secure against unauthorized logins.
      </Text>
      <Button
        mt={2}
        sx={{ borderRadius: 100, px: 6 }}
        onClick={() => props.onClose?.(true)}
      >
        Done
      </Button>

      <Button
        variant={"anchor"}
        mt={2}
        onClick={() => {
          props.onClose && props.onClose(true);
          setTimeout(async () => {
            await showMultifactorDialog(props.authenticatorType);
          }, 100);
        }}
      >
        Setup a fallback 2FA method
      </Button>
    </Flex>
  );
}

type Fallback2FAEnabledProps = StepComponentProps<OnNextFunction> & {
  fallbackMethod: AuthenticatorType;
  primaryMethod: AuthenticatorType;
};
function Fallback2FAEnabled(props: Fallback2FAEnabledProps) {
  const { fallbackMethod, primaryMethod, onClose } = props;
  return (
    <Flex
      mb={2}
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Fallback2FA width={200} />
      <Text
        variant={"heading"}
        mt={2}
        sx={{ fontSize: "subheading", textAlign: "center" }}
      >
        Fallback 2FA method enabled!
      </Text>
      <Text
        variant={"body"}
        mt={1}
        sx={{ textAlign: "center", color: "fontTertiary" }}
      >
        You will now receive your 2FA codes on your{" "}
        {mfaMethodToPhrase(fallbackMethod)} in case you lose access to your{" "}
        {mfaMethodToPhrase(primaryMethod)}.
      </Text>
      <Button
        mt={2}
        sx={{ borderRadius: 100, px: 6 }}
        onClick={() => onClose?.(true)}
      >
        Done
      </Button>
    </Flex>
  );
}

function VerifyAuthenticatorForm(props: VerifyAuthenticatorFormProps) {
  const { codeHelpText, onSubmitCode, children } = props;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Flex
      ref={formRef}
      as="form"
      id="2faForm"
      sx={{ overflow: "hidden", flex: 1, flexDirection: "column" }}
      onSubmit={async (e) => {
        if (!formRef.current) return;
        e.preventDefault();
        const form = new FormData(formRef.current);
        const code = form.get("code");
        if (!code || code.toString().length !== 6) return;
        onSubmitCode(code.toString());
      }}
    >
      {children}
      <Field
        id="code"
        name="code"
        helpText={codeHelpText}
        label="Enter the 6-digit code"
        sx={{ alignItems: "center", mt: 2 }}
        required
        placeholder="010101"
        type="number"
        variant="clean"
        styles={{
          input: {
            width: "100%",
            fontSize: 38,
            fontFamily: "monospace",
            textAlign: "center"
          }
        }}
      />
    </Flex>
  );
}

export function mfaMethodToPhrase(method: AuthenticatorType): string {
  return method === "email"
    ? "email"
    : method === "app"
    ? "authentication app"
    : "phone number";
}
