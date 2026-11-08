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
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { Button, Flex, Text } from "@ui";
import { clipboard, files, shell } from "@platform";
import { QRCode } from "@ui";
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
  Checkmark,
  Pro
} from "../../components/icons";
import { Field } from "../components/field";
import { useTimer } from "../../hooks/use-timer";
import { db } from "../../common/db";
import {
  Authenticator,
  StepComponent,
  SubmitCodeFunction,
  StepComponentProps,
  OnNextFunction
} from "./types";
import { ErrorText } from "../components/error-text";
import { AuthenticatorType } from "@notesnook/core";
import { MultifactorDialog } from "./multi-factor-dialog";
import { strings } from "@notesnook/intl";
import { withFeatureCheck } from "../../common";
import { useIsFeatureAvailable } from "@notesnook/common";
import { useStepSubmit } from "./submit";
import { SvgImage } from "../../components/svg-image";

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
  const sms2FAFeature = useIsFeatureAvailable("sms2FA");
  const { authenticators, onNext } = props;
  const filteredAuthenticators = authenticators
    .map((a) => Authenticators.find((auth) => auth.type === a))
    .filter((a) => !!a) as Authenticator[];

  useStepSubmit(() => onNext(filteredAuthenticators[selected]));

  return (
    <Flex sx={{ flex: 1, flexDirection: "column" }}>
      {filteredAuthenticators.map((auth, index) => (
        <Flex
          key={auth.type}
          onPress={withFeatureCheck(
            auth.type === "sms" ? "sms2FA" : undefined,
            () => setSelected(index)
          )}
          sx={{
            mt: 2,
            flexDirection: "row",
            alignItems: "flex-start",
            bg: selected === index ? "shade" : "transparent",
            borderRadius: "default",
            p: 1
          }}
        >
          <Flex
            sx={{
              bg: selected === index ? "shade" : "background-secondary",
              borderRadius: 100,
              width: 35,
              height: 35,
              mr: 2,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <auth.icon
              size={16}
              color={selected === index ? "accent" : "icon"}
            />
          </Flex>
          <Flex sx={{ flexDirection: "column", flex: 1 }}>
            <Flex sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text variant="title" sx={{ fontWeight: "body" }}>
                {auth.title}
              </Text>
              {sms2FAFeature?.isAllowed === false && auth.type === "sms" && (
                <Pro size={16} color="accent" />
              )}
              {auth.recommended ? (
                <Text
                  variant="subBody"
                  sx={{
                    bg: "shade",
                    px: 1,
                    borderRadius: "default",
                    color: "accent"
                  }}
                >
                  {strings.recommended()}
                </Text>
              ) : null}
            </Flex>
            <Text variant="body" sx={{ mt: 1, fontWeight: "normal" }}>
              {auth.subtitle}
            </Text>
          </Flex>
        </Flex>
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
  const [authenticatorDetails, setAuthenticatorDetails] = useState<{
    sharedKey: string | null;
    authenticatorUri: string | null;
  }>({
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
      <Text variant="body">{strings.mfaScanQrCode()}</Text>
      <Flex sx={{ alignSelf: "center", my: 1 }}>
        {authenticatorDetails.authenticatorUri ? (
          <QRCode
            value={authenticatorDetails.authenticatorUri}
            ecLevel="M"
            size={150}
          />
        ) : (
          <Loading />
        )}
      </Flex>
      <Text variant="subBody">{`${strings.scanQrError()}:`}</Text>
      <Flex
        sx={{
          bg: "background-secondary",
          mt: 2,
          borderRadius: "default",
          alignItems: "center",
          flexDirection: "row",
          p: 1
        }}
      >
        <Text
          selectable
          sx={{
            ml: 1,
            flex: 1,
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
          variant="secondary"
          onPress={async () => {
            if (!authenticatorDetails.sharedKey) return;
            await clipboard.write({
              "text/plain": authenticatorDetails.sharedKey
            });
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

function SendCodeLabel(props: {
  isSending: boolean;
  enabled: boolean;
  elapsed: number;
}) {
  return (
    <Text variant="body">
      {props.isSending ? (
        <Loading size={18} />
      ) : props.enabled ? (
        strings.sendCode()
      ) : (
        strings.resendCode(props.elapsed)
      )}
    </Text>
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
        sx={{
          mt: 2,
          bg: "background-secondary",
          borderRadius: "default",
          alignItems: "center",
          flexDirection: "row"
        }}
      >
        <Text
          sx={{ ml: 2, flex: 1, fontSize: "subtitle", fontFamily: "monospace" }}
        >
          {email}
        </Text>
        <Button
          variant="secondary"
          sx={{ p: 2, m: 0, alignSelf: "center" }}
          disabled={isSending || !enabled}
          onPress={async () => {
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
          <SendCodeLabel
            isSending={isSending}
            enabled={enabled}
            elapsed={elapsed}
          />
        </Button>
      </Flex>
      <ErrorText error={error} />
    </VerifyAuthenticatorForm>
  );
}

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

function SetupSMS(props: SetupAuthenticatorProps) {
  const { onSubmitCode } = props;
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const { elapsed, enabled, setEnabled } = useTimer(`2fa.sms`, 60);

  return (
    <VerifyAuthenticatorForm
      codeHelpText={strings.mfaSmsDesc()}
      onSubmitCode={onSubmitCode}
    >
      <Field
        id="phone-number"
        helpText={strings.mfaSmsDesc()}
        label={strings.phoneNumber()}
        sx={{ mt: 2 }}
        autoFocus
        required
        placeholder="+1234567890"
        onChangeText={(text) => {
          const number = text.replace(/[\s-]/g, "");
          if (!number) return setError("");

          if (PHONE_REGEX.test(number)) {
            setPhoneNumber(number);
            setError("");
          } else {
            setPhoneNumber("");
            setError(strings.enterValidPhone());
          }
        }}
        action={{
          disabled: !!error || isSending || !enabled,
          component: (
            <SendCodeLabel
              isSending={isSending}
              enabled={enabled}
              elapsed={elapsed}
            />
          ),
          onPress: async () => {
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
  const [copied, setCopied] = useState(false);
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

  useStepSubmit(() => onNext(props.authenticatorType));

  const actions = [
    {
      title: strings.print(),
      icon: Print,
      action: async () => {
        await shell.printHtml(
          "Notesnook 2FA Recovery Codes",
          `<pre>${codes.join("\n")}</pre>`
        );
      }
    },
    {
      title: copied ? "Copied!" : strings.copy(),
      icon: Copy,
      action: async () => {
        await clipboard.write({ "text/plain": codes.join("\n") });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    },
    {
      title: strings.network.download(),
      icon: Download,
      action: async () => {
        const file = await files.create("notesnook-recovery-codes.txt");
        await file.write(new TextEncoder().encode(codes.join("\n")));
        await file.close();
      }
    },
    { title: strings.regenerate(), icon: Refresh, action: generate }
  ];

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          flexDirection: "row",
          flexWrap: "wrap",
          bg: "background-secondary",
          p: 2,
          gap: 1,
          borderRadius: "default"
        }}
      >
        {codes.map((code) => (
          <Text
            key={code}
            selectable
            variant="body"
            sx={{
              width: "24%",
              fontFamily: "monospace",
              textAlign: "center",
              fontWeight: "body",
              color: "paragraph"
            }}
          >
            {code}
          </Text>
        ))}
      </Flex>
      <Flex
        sx={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          mt: 2
        }}
      >
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="secondary"
            sx={{ mr: 1, py: 1, flexDirection: "row", alignItems: "center" }}
            onPress={action.action}
          >
            <action.icon size={15} />
            <Text>{action.title}</Text>
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
      sx={{
        mb: 2,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <SvgImage name="mfa" width={120} height={120} />
      <Text
        variant="heading"
        sx={{ mt: 2, fontSize: "subheading", textAlign: "center" }}
      >
        {strings.twoFactorAuthEnabled()}
      </Text>
      <Text
        variant="body"
        sx={{ mt: 1, textAlign: "center", color: "paragraph-secondary" }}
      >
        {strings.mfaDone()}
      </Text>
      <Button
        sx={{ mt: 2, borderRadius: 100, px: 6 }}
        onPress={() => props.onClose?.(true)}
      >
        <Text>{strings.done()}</Text>
      </Button>

      <Button
        variant="anchor"
        sx={{ mt: 2 }}
        onPress={() => {
          props.onClose && props.onClose(true);
          setTimeout(async () => {
            await MultifactorDialog.show({
              primaryMethod: props.authenticatorType
            });
          }, 100);
        }}
      >
        <Text>{strings.secondary2faMethod()}</Text>
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
      sx={{
        mb: 2,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <SvgImage name="fallback2fa" width={200} height={200} />
      <Text
        variant="heading"
        sx={{ mt: 2, fontSize: "subheading", textAlign: "center" }}
      >
        {strings.fallbackMethodEnabled()}
      </Text>
      <Text
        variant="body"
        sx={{ mt: 1, textAlign: "center", color: "paragraph-secondary" }}
      >
        {strings.mfaFallbackMethodText(fallbackMethod, primaryMethod)}
      </Text>
      <Button
        sx={{ mt: 2, borderRadius: 100, px: 6 }}
        onPress={() => onClose?.(true)}
      >
        <Text>{strings.done()}</Text>
      </Button>
    </Flex>
  );
}

function VerifyAuthenticatorForm(props: VerifyAuthenticatorFormProps) {
  const { codeHelpText, onSubmitCode, children } = props;
  const code = useRef("");
  const submit = useCallback(() => {
    if (code.current.length !== 6) return;
    onSubmitCode(code.current);
  }, [onSubmitCode]);
  useStepSubmit(submit);

  return (
    <Flex sx={{ flex: 1, flexDirection: "column" }}>
      {children}
      <Field
        id="code"
        helpText={codeHelpText}
        label={strings.enterSixDigitCode()}
        sx={{ alignItems: "center", mt: 2 }}
        required
        placeholder="010101"
        variant="clean"
        maxLength={6}
        styles={{
          input: {
            width: "100%",
            fontSize: 38,
            fontFamily: "monospace",
            textAlign: "center"
          }
        }}
        onChangeText={(text) => (code.current = text.trim())}
        onSubmit={submit}
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
