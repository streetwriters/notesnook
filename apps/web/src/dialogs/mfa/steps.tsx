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
import { Text, Flex, Button, Box, Image } from "@theme-ui/components";
import { useSessionState } from "../../hooks/use-session-state";
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
} from "../../components/icons";
import Field from "../../components/field";
import { exportToPDF } from "../../common/export";
import { useTimer } from "../../hooks/use-timer";
import { phone } from "phone";
import { db } from "../../common/db";
import FileSaver from "file-saver";
import { writeText } from "clipboard-polyfill";
import MFA from "../../assets/mfa.svg?url";
import Fallback2FA from "../../assets/fallback2fa.svg?url";
import {
  Authenticator,
  StepComponent,
  SubmitCodeFunction,
  StepComponentProps,
  OnNextFunction
} from "./types";
import { ErrorText } from "../../components/error-text";
import { AuthenticatorType } from "@notesnook/core";
import { MultifactorDialog } from "./multi-factor-dialog";
import { strings } from "@notesnook/intl";

const QRCode = React.lazy(() => import("../../re-exports/react-qrcode-logo"));

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
    title: strings.mfaAuthAppTitle(),
    subtitle: strings.mfaAuthAppDesc(),
    icon: MfaAuthenticator,
    recommended: true
  },
  {
    type: "sms",
    title: strings.mfaSmsTitle(),
    subtitle: strings.mfaSmsDesc(),
    icon: MfaSms
  },
  {
    type: "email",
    title: strings.mfaEmailTitle(),
    subtitle: strings.mfaEmailDesc(),
    icon: MfaEmail
  }
];
export type AuthenticatorOnNext = (authenticator: Authenticator) => void;
export type AuthenticatorTypeOnNext = (type: AuthenticatorType) => void;

export const steps = {
  choose: (): Step<AuthenticatorOnNext> => ({
    title: strings["2fa"](),
    description: strings.select2faMethod(),
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
    title: strings.saveRecoveryCodes(),
    description: strings.saveRecoveryCodesDesc(),
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
    title: strings.addFallback2faMethod(),
    description: strings.addFallback2faMethodDesc(),
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
            bg: selected === index ? "shade" : "transparent",
            px: 0
          }}
          onClick={() => setSelected(index)}
        >
          <auth.icon
            className="2fa-icon"
            sx={{
              bg: selected === index ? "shade" : "var(--background-secondary)",
              borderRadius: 100,
              width: 35,
              height: 35,
              mr: 2
            }}
            size={16}
            color={selected === index ? "accent" : "icon"}
          />
          <Text variant={"title"} sx={{ fontWeight: "body" }}>
            {auth.title}{" "}
            {auth.recommended ? (
              <Text
                as="span"
                variant={"subBody"}
                bg="shade"
                px={1}
                sx={{ borderRadius: "default", color: "accent" }}
              >
                {strings.recommended()}
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
        if (isFallback) await db.mfa.enableFallback(authenticator, code);
        else await db.mfa.enable(authenticator, code);
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
      setAuthenticatorDetails(await db.mfa.setup("app"));
    })();
  }, []);

  return (
    <VerifyAuthenticatorForm
      codeHelpText={strings.mfaScanQrCodeHelpText()}
      onSubmitCode={onSubmitCode}
    >
      <Text variant={"body"}>{strings.mfaScanQrCode()}</Text>
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
      <Text variant={"subBody"}>{`${strings.scanQrError()}:`}</Text>
      <Flex
        bg="var(--background-secondary)"
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
            color: "paragraph",
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
      const { email } = (await db.user.getUser()) || {};
      setEmail(email);
    })();
  }, []);

  return (
    <VerifyAuthenticatorForm
      codeHelpText={strings.mfaEmailDesc()}
      onSubmitCode={onSubmitCode}
    >
      <Flex
        mt={2}
        bg="var(--background-secondary)"
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
              await db.mfa.setup("email");
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
            strings.sendCode()
          ) : (
            strings.resendCode(elapsed)
          )}
        </Button>
      </Flex>
      <ErrorText error={error} />
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
      codeHelpText={strings.mfaSmsDesc()}
      onSubmitCode={onSubmitCode}
    >
      <Field
        inputRef={inputRef}
        id="phone-number"
        name="phone-number"
        helpText={strings.mfaSmsDesc()}
        label={strings.phoneNumber()}
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
          disabled: !!error || isSending || !enabled,
          component: (
            <Text variant={"body"}>
              {isSending ? (
                <Loading size={18} />
              ) : enabled ? (
                strings.sendCode()
              ) : (
                strings.resendCode(elapsed)
              )}
            </Text>
          ),
          onClick: async () => {
            if (!phoneNumber) {
              setError(strings.phoneNumberNotEntered());
              return;
            }

            setIsSending(true);
            try {
              await db.mfa.setup("sms", phoneNumber);
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
      <ErrorText error={error} />
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
      const codes = await db.mfa.codes();
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
        title: strings.print(),
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
        title: strings.copy(),
        icon: Copy,
        action: async () => {
          await writeText(codes.join("\n"));
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
        title: strings.network.download(),
        icon: Download,
        action: () => {
          FileSaver.saveAs(
            new Blob([Buffer.from(codes.join("\n"))]),
            `notesnook-recovery-codes.txt`
          );
        }
      },
      { title: strings.regenerate(), icon: Refresh, action: generate }
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
          bg: "var(--background-secondary)",
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
              color: "paragraph"
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
      <Image src={MFA} style={{ flexShrink: 0, width: 120, height: 120 }} />
      <Text
        variant={"heading"}
        mt={2}
        sx={{ fontSize: "subheading", textAlign: "center" }}
      >
        {strings.twoFactorAuthEnabled()}
      </Text>
      <Text
        variant={"body"}
        mt={1}
        sx={{ textAlign: "center", color: "var(--paragraph-secondary)" }}
      >
        {strings.mfaDone()}
      </Text>
      <Button
        mt={2}
        sx={{ borderRadius: 100, px: 6 }}
        onClick={() => props.onClose?.(true)}
      >
        {strings.done()}
      </Button>

      <Button
        variant={"anchor"}
        mt={2}
        onClick={() => {
          props.onClose && props.onClose(true);
          setTimeout(async () => {
            await MultifactorDialog.show({
              primaryMethod: props.authenticatorType
            });
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
      <Image
        src={Fallback2FA}
        style={{ flexShrink: 0, width: 200, height: 200 }}
      />
      <Text
        variant={"heading"}
        mt={2}
        sx={{ fontSize: "subheading", textAlign: "center" }}
      >
        {strings.fallbackMethodEnabled()}
      </Text>
      <Text
        variant={"body"}
        mt={1}
        sx={{ textAlign: "center", color: "var(--paragraph-secondary)" }}
      >
        {strings.mfaFallbackMethodText(fallbackMethod, primaryMethod)}
      </Text>
      <Button
        mt={2}
        sx={{ borderRadius: 100, px: 6 }}
        onClick={() => onClose?.(true)}
      >
        {strings.done()}
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
        label={strings.enterSixDigitCode()}
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
