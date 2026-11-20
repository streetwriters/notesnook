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

import { IconBox } from "../../components/settings-ui";
import React, {
  Fragment,
  PropsWithChildren,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Text, Flex, Button, Box, Image } from "@theme-ui/components";
import type { ThemeUIStyleObject } from "@theme-ui/css";
import { OtpInput } from "../../components/otp-input";
import { useSessionState } from "../../hooks/use-session-state";
import {
  Loading,
  DeviceMobileCamera,
  Chat,
  Envelope,
  Download,
  Printer,
  Copy,
  ArrowsCounterClockwise,
  Checkmark,
  Pro
} from "../../components/icons";
import Field from "../../components/field";
import { exportToPDF } from "../../common/export";
import { useTimer } from "../../hooks/use-timer";
import { phone } from "phone";
import { db } from "../../common/db";
import FileSaver from "file-saver";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";
import Fallback2FA from "../../assets/fallback2fa.svg?url";
import {
  Authenticator,
  StepComponent,
  SubmitCodeFunction,
  StepComponentProps,
  OnNextFunction
} from "./types";
import { AuthErrorText } from "../../components/error-text";
import { AuthenticatorType } from "@notesnook/core";
import { MultifactorDialog } from "./multi-factor-dialog";
import { strings } from "@notesnook/intl";
import { withFeatureCheck } from "../../common";
import { useIsFeatureAvailable } from "@notesnook/common";

const QRCode = React.lazy(() => import("../../re-exports/react-qrcode-logo"));

export type Steps = typeof steps;
export type FallbackSteps = typeof fallbackSteps;
export type StepKeys = keyof Steps; // "choose" | "setup" | "recoveryCodes" | "finish";
export type FallbackStepKeys = "choose" | "setup" | "finish";

export type StepButtonContext = {
  onClose: (result: boolean) => void;
  goBack: () => void;
};
export type StepButton = {
  text: string;
  // when omitted on the positive button, it submits the step's form
  onClick?: (context: StepButtonContext) => void;
};

export type Step<
  T extends OnNextFunction = AuthenticatorTypeOnNext | AuthenticatorOnNext
> = {
  title?: string;
  description?: string;
  component?: StepComponent<T>;
  next?: StepKeys;
  cancellable?: boolean;
  width?: number;
  positiveButton?: StepButton;
  negativeButton?: StepButton;
  hideSeparator?: boolean;
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
    icon: DeviceMobileCamera,
    recommended: true
  },
  {
    type: "sms",
    title: strings.mfaSmsTitle(),
    subtitle: strings.mfaSmsDesc(),
    icon: Chat
  },
  {
    type: "email",
    title: strings.mfaEmailTitle(),
    subtitle: strings.mfaEmailDesc(),
    icon: Envelope
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
    component: ({ onNext, onError }) => (
      <AuthenticatorSelector
        onNext={onNext}
        onError={onError}
        authenticator={authenticator.type}
      />
    ),
    cancellable: true,
    positiveButton: { text: strings.verify() },
    negativeButton: {
      text: strings.change2faMethod(),
      onClick: ({ goBack }) => goBack()
    }
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
    title: strings.twoFactorAuthEnabled(),
    description: strings.mfaDone(),
    hideSeparator: true,
    width: 440,
    positiveButton: {
      text: strings.done(),
      onClick: ({ onClose }) => onClose(true)
    },
    negativeButton: {
      text: strings.secondary2faMethod(),
      onClick: ({ onClose }) => {
        onClose(true);
        setTimeout(async () => {
          await MultifactorDialog.show({ primaryMethod: authenticatorType });
        }, 100);
      }
    },
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
    positiveButton: { text: strings.verify() },
    negativeButton: {
      text: strings.change2faMethod(),
      onClick: ({ goBack }) => goBack()
    },
    component: ({ onNext, onError }) => (
      <AuthenticatorSelector
        onNext={onNext}
        onError={onError}
        authenticator={authenticator.type}
        isFallback
      />
    )
  }),
  finish: (
    fallbackMethod: AuthenticatorType,
    primaryMethod: AuthenticatorType
  ): FallbackStep<OnNextFunction> => ({
    hideSeparator: true,
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

  return (
    <Flex
      as="form"
      id="2faForm"
      sx={{
        overflow: "hidden",
        flex: 1,
        flexDirection: "column",
        gap: "spacing4",
        pt: "spacing6"
      }}
      onSubmit={(e) => {
        e.preventDefault();
        const authenticator = filteredAuthenticators[selected];
        onNext(authenticator);
      }}
    >
      {filteredAuthenticators.map((auth, index) => {
        const isSelected = selected === index;
        return (
          <Button
            key={auth.type}
            variant="secondary"
            type="button"
            sx={{
              display: "flex",
              fontFamily: "body",
              alignItems: "center",
              gap: "spacing3",
              px: "spacing3",
              py: "spacing4",
              width: "100%",
              textAlign: "left",

              color: "inherit",
              cursor: "pointer",
              border: "1px solid",
              borderColor: isSelected ? "transparent" : "border",
              borderRadius: "radius2",
              bg: isSelected ? "background-selected" : "background",
              ":hover": {
                bg: isSelected ? "background-selected" : "hover",
                ".2fa-icon-box": {
                  bg: isSelected ? "background" : "hover-secondary"
                }
              }
            }}
            onClick={withFeatureCheck(
              auth.type === "sms" ? "sms2FA" : undefined,
              () => setSelected(index)
            )}
          >
            <IconBox
              className="2fa-icon-box"
              sx={isSelected ? { bg: "background" } : undefined}
            >
              <auth.icon className="2fa-icon" size={15} color="icon" />
            </IconBox>
            <Flex sx={{ flex: 1, flexDirection: "column", gap: "spacing3" }}>
              <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
                <Text
                  variant={"body"}
                  sx={{
                    fontSize: "sm",
                    fontWeight: 500,
                    lineHeight: 1,
                    color: "heading"
                  }}
                >
                  {auth.title}
                </Text>
                {sms2FAFeature?.isAllowed === false && auth.type === "sms" && (
                  <Pro size={16} color="orange" />
                )}
                {auth.recommended ? (
                  <Text
                    as="span"
                    variant={"subBody"}
                    sx={{
                      bg: "accent",
                      color: "accentForeground",
                      px: "spacing2",
                      py: "spacing1",
                      borderRadius: "50px",
                      fontSize: "3xs",
                      fontWeight: 500,
                      lineHeight: 1
                    }}
                  >
                    {strings.recommended()}
                  </Text>
                ) : null}
              </Flex>
              <Text
                as="div"
                variant="body"
                sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}
              >
                {auth.subtitle}
              </Text>
            </Flex>
            <Box
              sx={{
                width: 15,
                height: 15,
                flexShrink: 0,
                borderRadius: "50%",
                border: "1px solid",
                borderColor: isSelected ? "accent" : "border-tertiary",
                bg: "background",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isSelected ? (
                <Box
                  sx={{
                    width: "7.5px",
                    height: "7.5px",
                    borderRadius: "50%",
                    bg: "accent"
                  }}
                />
              ) : null}
            </Box>
          </Button>
        );
      })}
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
  const { copied, copy } = useCopyToClipboard();

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
      <Flex
        sx={{ flexDirection: "column", alignItems: "center", gap: "spacing6" }}
      >
        <Box
          sx={{
            alignSelf: "center",
            p: "12px",
            bg: "background",
            border: "1px solid",
            borderColor: "border-secondary",
            lineHeight: 0
          }}
        >
          {authenticatorDetails.authenticatorUri ? (
            <Suspense fallback={<Loading />}>
              <QRCode
                value={authenticatorDetails.authenticatorUri}
                ecLevel={"M"}
                size={120}
              />
            </Suspense>
          ) : (
            <Loading />
          )}
        </Box>
        <Flex sx={{ flexDirection: "column", gap: "spacing4", width: "100%" }}>
          <Text
            variant={"body"}
            sx={{
              fontSize: "xs",
              fontWeight: 600,
              lineHeight: 1.3,
              color: "paragraph-secondary"
            }}
          >{`${strings.scanQrError()}:`}</Text>
          <Flex
            sx={{
              bg: "background-secondary",
              borderRadius: "radius2",
              alignItems: "center",
              justifyContent: "space-between",
              px: "spacing4",
              py: "spacing6"
            }}
          >
            <Text
              className="selectable"
              sx={{
                flex: 1,
                overflowWrap: "anywhere",
                color: "placeholder",
                fontSize: "xs",
                lineHeight: 1
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
              type="button"
              sx={{
                display: "flex",
                fontFamily: "body",
                alignItems: "center",
                gap: "spacing3",
                p: 0,
                bg: "transparent",
                border: "none",
                cursor: "pointer",

                fontSize: "sm",
                fontWeight: 600,
                lineHeight: 1,
                color: "accent"
              }}
              onClick={() => {
                if (!authenticatorDetails.sharedKey) return;
                copy(authenticatorDetails.sharedKey);
              }}
            >
              {copied ? (
                <Checkmark size={15} color="accent" />
              ) : (
                <Copy size={15} color="accent" />
              )}
              {copied ? strings.copied() : strings.copy()}
            </Button>
          </Flex>
        </Flex>
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
      codeHelpText="Enter the code sent to your email below"
      onSubmitCode={onSubmitCode}
    >
      <Flex
        sx={{
          bg: "background-secondary",
          borderRadius: "radius2",
          overflowWrap: "anywhere",
          alignItems: "center",
          justifyContent: "space-between",
          px: "spacing4",
          py: "spacing6"
        }}
      >
        <Text
          sx={{
            flex: 1,
            fontSize: "sm",
            lineHeight: 1,
            color: "paragraph"
          }}
        >
          {email}
        </Text>
        <Button
          variant="secondary"
          type="button"
          sx={{
            display: "flex",
            fontFamily: "body",
            alignItems: "center",
            p: 0,
            bg: "transparent",
            border: "none",
            cursor: "pointer",

            fontSize: "sm",
            fontWeight: 600,
            lineHeight: 1,
            color: "accent",
            ":disabled": { cursor: "default", opacity: 0.7 }
          }}
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
            <Loading size={15} />
          ) : enabled ? (
            strings.sendCode()
          ) : (
            strings.resendCode(elapsed)
          )}
        </Button>
      </Flex>
      <AuthErrorText error={error} />
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
        label={strings.phoneNumber()}
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
            setError(strings.enterValidPhone());
          }
        }}
        action={{
          disabled: !!error || isSending || !enabled,
          component: (
            <Text
              variant={"body"}
              sx={{ fontSize: "sm", fontWeight: 600, color: "accent" }}
            >
              {isSending ? (
                <Loading size={15} />
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
      <AuthErrorText error={error} />
    </VerifyAuthenticatorForm>
  );
}

const recoveryActionSx: ThemeUIStyleObject = {
  display: "flex",
  fontFamily: "body",
  flex: 1,
  minWidth: 0,
  alignItems: "center",
  justifyContent: "center",
  gap: "spacing3",
  px: "spacing4",
  py: "spacing6",
  bg: "transparent",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "radius2",
  cursor: "pointer",

  fontSize: "xs",
  fontWeight: 600,
  lineHeight: 1,
  color: "buttonForeground-secondary",
  ":hover": { bg: "hover" }
};

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
        icon: Printer,
        action: async () => {
          if (!recoveryCodesRef.current) return;
          await exportToPDF(
            "Notesnook 2FA Recovery Codes",
            recoveryCodesRef.current.outerHTML
          );
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
      {
        title: strings.regenerate(),
        icon: ArrowsCounterClockwise,
        action: generate
      }
    ],
    [codes, generate]
  );
  const { copied, copy } = useCopyToClipboard();

  return (
    <Flex
      as="form"
      id="2faForm"
      onSubmit={(e) => {
        e.preventDefault();
        onNext(props.authenticatorType);
      }}
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing6",
        bg: "background-secondary",
        borderRadius: "radius2",
        p: "spacing6",
        mt: "spacing6"
      }}
    >
      <Box
        className="selectable"
        ref={recoveryCodesRef}
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          width: "100%",
          rowGap: "spacing3",
          columnGap: "spacing4"
        }}
      >
        {codes.map((code) => (
          <Text
            key={code}
            className="selectable"
            as="code"
            variant={"body"}
            sx={{
              textAlign: "center",
              fontSize: "xs",
              lineHeight: 1.2,
              color: "heading"
            }}
          >
            {code}
          </Text>
        ))}
      </Box>
      <Box
        sx={{
          width: "100%",
          height: 0,
          borderTop: "1px solid",
          borderColor: "border"
        }}
      />
      <Flex sx={{ width: "100%", gap: "spacing4" }}>
        {actions.map((action, i) => (
          <Fragment key={action.title}>
            <Button
              variant="secondary"
              type="button"
              sx={recoveryActionSx}
              onClick={action.action}
            >
              <action.icon size={15} />
              <span className="title">{action.title}</span>
            </Button>
            {i === 0 ? (
              <Button
                variant="secondary"
                type="button"
                sx={recoveryActionSx}
                onClick={() => copy(codes.join("\n"))}
              >
                {copied ? <Checkmark size={15} /> : <Copy size={15} />}
                <span className="title">
                  {copied ? strings.copied() : strings.copy()}
                </span>
              </Button>
            ) : null}
          </Fragment>
        ))}
      </Flex>
    </Flex>
  );
}

type TwoFactorEnabledProps = StepComponentProps<AuthenticatorTypeOnNext> & {
  authenticatorType: AuthenticatorType;
};
function TwoFactorEnabled(_props: TwoFactorEnabledProps) {
  return null;
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
  const [codeError, setCodeError] = useState<string>();
  const [code, setCode] = useState("");
  return (
    <Flex
      ref={formRef}
      as="form"
      id="2faForm"
      sx={{
        flex: 1,
        flexDirection: "column",
        gap: "spacing6",
        pt: "spacing6"
      }}
      onSubmit={async (e) => {
        if (!formRef.current) return;
        e.preventDefault();
        const form = new FormData(formRef.current);
        const code = form.get("code");
        if (!code || code.toString().length !== 6) {
          setCodeError(strings.enterSixDigitCode());
          return;
        }
        setCodeError(undefined);
        onSubmitCode(code.toString());
      }}
    >
      {children}
      <Flex sx={{ alignItems: "center", gap: "7px" }}>
        <Flex
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            bg: "background-secondary",
            borderRadius: "radius1"
          }}
        >
          <DeviceMobileCamera size={15} />
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing3", flex: 1 }}>
          <Text
            variant="body"
            sx={{
              fontSize: "sm",
              fontWeight: 500,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {strings.enterSixDigitCode()}
          </Text>
          <Text
            variant="body"
            sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}
          >
            {codeHelpText}
          </Text>
        </Flex>
      </Flex>
      <OtpInput
        length={6}
        autoFocus
        value={code}
        onChange={(v) => {
          setCode(v);
          setCodeError(undefined);
        }}
        sx={{ justifyContent: "center", gap: "10px" }}
      />
      <AuthErrorText error={codeError} />
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
