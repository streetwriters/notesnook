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

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { makeURL, useQueryParams } from "../navigation";
import { db } from "../common/db";
import { Loader } from "../components/loader";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";
import { AuthField, AuthFormContext, SubmitButton } from "./auth";
import Config from "../utils/config";
import { EVENTS, User } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useKeyStore } from "../interfaces/key-store";
import { ScrollContainer } from "@notesnook/ui";
import Logo from "../assets/notesnook-logo.png";
import {
  ChevronLeft,
  KeyIcon,
  Trash,
  CheckCircle,
  Copy,
  Download,
  FloppyDisk,
  RecoveryKeyShieldCheck
} from "../components/icons";
import { writeText } from "clipboard-polyfill";
import FileSaver from "file-saver";

const QRCode = React.lazy(() => import("../re-exports/react-qrcode-logo"));

type RecoveryMethodType = "key" | "reset";
type RecoveryMethodsFormData = Record<string, unknown>;

type RecoveryKeyFormData = {
  recoveryKey: string;
};

type NewPasswordFormData = {
  userResetRequired?: boolean;
  password: string;
  confirmPassword: string;
  recoveryKey?: string;
};

type RecoveryFormData = {
  methods: RecoveryMethodsFormData;
  "method:key": RecoveryKeyFormData;
  "method:reset": NewPasswordFormData;
  new: NewPasswordFormData;
  final: RecoveryMethodsFormData;
};

type BaseFormData = RecoveryMethodsFormData;

type NavigateFunction = <TRoute extends RecoveryRoutes>(
  route: TRoute,
  formData?: Partial<RecoveryFormData[TRoute]>
) => void;
type BaseRecoveryComponentProps<TRoute extends RecoveryRoutes> = {
  navigate: NavigateFunction;
  formData?: Partial<RecoveryFormData[TRoute]>;
};
type RecoveryRoutes =
  | "methods"
  | "method:key"
  | "method:reset"
  | "new"
  | "final";
type RecoveryProps = { route: RecoveryRoutes };

type RecoveryComponent<TRoute extends RecoveryRoutes> = (
  props: BaseRecoveryComponentProps<TRoute>
) => JSX.Element;

function getRouteComponent<TRoute extends RecoveryRoutes>(
  route: TRoute
): RecoveryComponent<TRoute> | undefined {
  switch (route) {
    case "methods":
      return RecoveryMethods as RecoveryComponent<TRoute>;
    case "method:key":
      return RecoveryKeyMethod as RecoveryComponent<TRoute>;
    case "method:reset":
    case "new":
      return NewPassword as RecoveryComponent<TRoute>;
    case "final":
      return Final as RecoveryComponent<TRoute>;
  }
  return undefined;
}

const routePaths: Record<RecoveryRoutes, string> = {
  methods: "/account/recovery/methods",
  "method:key": "/account/recovery/method/key",
  "method:reset": "/account/recovery/method/reset",
  new: "/account/recovery/new",
  final: "/account/recovery/final"
};

function useAuthenticateUser({
  code,
  userId
}: {
  code: string;
  userId: string;
}) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState<User>();
  useEffect(() => {
    async function authenticateUser() {
      setIsAuthenticating(true);
      try {
        const accessToken = await db.tokenManager.getAccessToken();
        if (!accessToken) {
          await db.tokenManager.getAccessTokenFromAuthorizationCode(
            userId,
            code.replace(/ /gm, "+")
          );
        }
        const user = await db.user.fetchUser();
        setUser(user);
      } catch (e) {
        console.error(e);
        showToast("error", strings.biometricsAuthFailed());
        openURL("/");
      } finally {
        setIsAuthenticating(false);
      }
    }

    authenticateUser();
  }, [code, userId]);
  return { isAuthenticating, user };
}

function Recovery(props: RecoveryProps) {
  const [route, setRoute] = useState(props.route);
  const [storedFormData, setStoredFormData] = useState<
    BaseFormData | undefined
  >();

  const [{ code, userId }] = useQueryParams();
  useAuthenticateUser({ code, userId });
  const Route = useMemo(() => getRouteComponent(route), [route]);
  useEffect(() => {
    window.history.replaceState({}, "", makeURL(routePaths[route]));
  }, [route]);

  return (
    <AuthContainer>
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
            navigate={(route, formData) => {
              setStoredFormData(formData);
              setRoute(route);
            }}
            formData={storedFormData}
          />
        )}
      </ScrollContainer>
    </AuthContainer>
  );
}
export default Recovery;

type RecoveryMethod = {
  type: RecoveryMethodType;
  title: () => string;
  testId: string;
  description: () => string;
  isDangerous?: boolean;
};

const recoveryMethods: RecoveryMethod[] = [
  {
    type: "key",
    testId: "step-recovery-key",
    title: () => strings.recoveryKeyMethod(),
    description: () => strings.recoveryKeyMethodDesc()
  },
  {
    type: "reset",
    testId: "step-reset-account",
    title: () => strings.clearDataAndResetMethod(),
    description: () => strings.clearDataAndResetMethodDesc(),
    isDangerous: true
  }
];

function RecoveryMethods(props: BaseRecoveryComponentProps<"methods">) {
  const { navigate } = props;
  const [selected, setSelected] = useState(0);

  if (isSessionExpired()) {
    navigate("new");
    return null;
  }

  return (
    <RecoveryForm
      testId="step-recovery-methods"
      type="methods"
      title={strings.chooseRecoveryMethod()}
      subtitle={strings.chooseRecoveryMethodDesc()}
      onSubmit={async () => {
        const selectedMethod = recoveryMethods[selected].type;
        navigate(`method:${selectedMethod}`, {
          userResetRequired: selectedMethod === "reset"
        });
      }}
    >
      {recoveryMethods.map((method, index) => (
        <Flex
          key={method.testId}
          data-test-id={method.testId}
          sx={{
            display: "flex",
            alignItems: "center",
            px: "spacing5",
            py: "spacing6",
            border:
              index === selected
                ? "1px solid var(--accent)"
                : "1px solid var(--border)",
            bg: index === selected ? "background-selected" : "background",
            borderRadius: "radius2",
            cursor: "pointer",
            ":first-of-type": { mt: 0 },
            mt: "spacing4"
          }}
          onClick={() => setSelected(index)}
        >
          <Flex
            sx={{
              flex: "1 1 auto",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: 0
            }}
          >
            <Flex sx={{ gap: "spacing3", alignItems: "flex-start" }}>
              <Flex
                sx={{
                  bg: "background-secondary",
                  borderRadius: "5px",
                  width: 30,
                  height: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                {method.type === "key" ? (
                  <KeyIcon size={15} color="icon" />
                ) : (
                  <Trash size={15} color="icon-error" />
                )}
              </Flex>
              <Flex
                sx={{
                  flexDirection: "column",
                  gap: "spacing3",
                  flex: "1 1 auto",
                  minWidth: 0
                }}
              >
                <Text
                  variant={"body"}
                  sx={{
                    fontWeight: 500,
                    fontSize: "sm",
                    color: "heading",
                    whiteSpace: "nowrap"
                  }}
                >
                  {method.title()}
                </Text>
                <Text
                  variant={"body"}
                  sx={{
                    fontWeight: 400,
                    fontSize: "xs",
                    color: "paragraph",
                    lineHeight: "1.3"
                  }}
                >
                  {method.description()}
                </Text>
              </Flex>
            </Flex>
            <input
              type="radio"
              name="recoveryMethod"
              checked={index === selected}
              onChange={() => setSelected(index)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                flexShrink: 0,
                marginLeft: "10px",
                width: 15,
                height: 15,
                borderRadius: "50%",
                border:
                  index === selected
                    ? "4px solid var(--accent)"
                    : "1.5px solid var(--border)",
                cursor: "pointer",
                margin: 0
              }}
            />
          </Flex>
        </Flex>
      ))}
      <SubmitButton text={strings.continue()} />
    </RecoveryForm>
  );
}

function RecoveryKeyMethod(props: BaseRecoveryComponentProps<"method:key">) {
  const { navigate, formData } = props;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    db.eventManager.subscribe(
      EVENTS.syncProgress,
      ({ type, current }: { type: string; current: number }) => {
        if (type === "download") {
          setProgress(current);
        }
      }
    );
  }, []);

  return (
    <RecoveryForm
      testId="step-recovery-key"
      type="method:key"
      title={strings.accountRecovery()}
      subtitle={strings.accountRecoveryWithKey()}
      loading={{
        title: strings.network.downloading(progress),
        subtitle: strings.keyRecoveryProgressDesc()
      }}
      onBack={() => navigate("methods")}
      onSubmit={async (form) => {
        const recoveryKey = form.recoveryKey;
        if (recoveryKey.length < 40) {
          throw new Error(strings.invalidRecoveryKey());
        }

        setProgress(0);

        const user = await db.user.getUser();
        if (!user) throw new Error(strings.notLoggedIn());
        await useKeyStore.getState().setValue("userEncryptionKey", recoveryKey);
        navigate("new", form);
      }}
    >
      <AuthField
        id="recoveryKey"
        type="password"
        label={strings.enterRecoveryKey()}
        autoComplete="none"
        autoFocus
        defaultValue={formData?.recoveryKey || ""}
      />
      <SubmitButton text={strings.continue()} />

      <Button
        type="button"
        mt={"spacing7"}
        variant={"new_anchor"}
        onClick={() => navigate("methods")}
        sx={{
          color: "paragraph",
          textDecoration: "underline",
          fontSize: "xs",
          textAlign: "center",
          alignSelf: "center"
        }}
      >
        {strings.dontHaveRecoveryKey()}
      </Button>
    </RecoveryForm>
  );
}

function NewPassword(props: BaseRecoveryComponentProps<"new">) {
  const { navigate, formData } = props;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    db.eventManager.subscribe(
      EVENTS.syncProgress,
      ({ current }: { current: number }) => {
        setProgress(current);
      }
    );
  }, []);

  return (
    <RecoveryForm
      testId="step-new-password"
      type="new"
      title={strings.resetAccountPassword()}
      subtitle={strings.accountPassDesc()}
      loading={{
        title: strings.resettingAccountPassword(progress),
        subtitle: strings.resetPasswordWait()
      }}
      onBack={() =>
        navigate(
          formData?.userResetRequired ? "methods" : "method:key",
          formData
        )
      }
      onSubmit={async (form) => {
        try {
          setProgress(0);

          if (form.password !== form.confirmPassword)
            throw new Error("Passwords do not match.");

          if (formData?.userResetRequired && !(await db.user.resetUser()))
            throw new Error("Failed to reset user.");

          if (!(await db.user.resetPassword(form.password)))
            throw new Error("Could not reset account password.");

          navigate("final");
        } catch (e) {
          if ((e as Error).message === "invalid input") {
            console.error(e);
            throw new Error(
              "Password reset failed because of invalid recovery key"
            );
          }

          throw e;
        }
      }}
    >
      {(form?: NewPasswordFormData) => (
        <>
          <AuthField
            id="password"
            type="password"
            autoComplete="current-password"
            label={strings.newPassword()}
            defaultValue={form?.password}
          />
          <AuthField
            id="confirmPassword"
            type="password"
            autoComplete="confirm-password"
            label={strings.confirmPassword()}
            defaultValue={form?.confirmPassword}
          />
          <SubmitButton text={strings.continue()} />
        </>
      )}
    </RecoveryForm>
  );
}

function Final(_props: BaseRecoveryComponentProps<"final">) {
  const [recoveryKey, setRecoveryKey] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  function flash(key: string) {
    setActiveButton(key);
    setTimeout(() => setActiveButton(null), 2000);
  }

  useEffect(() => {
    db.user
      .getMasterKey()
      .then((key) => setRecoveryKey(key?.key))
      .finally(() => setIsLoading(false));
  }, []);

  const handleGoToLogin = async () => {
    if (isSessionExpired()) {
      openURL("/sessionexpired");
    } else {
      await db.user.clearSessions(true);
      openURL("/login");
    }
  };

  const handleCopy = async () => {
    if (!recoveryKey) return;
    await writeText(recoveryKey);
    flash("copy");
  };

  const handleSaveToFile = async () => {
    if (!recoveryKey) return;

    const email = (await db.user.getUser())?.email || "user";
    FileSaver.saveAs(
      new Blob([recoveryKey]),
      `${email}-notesnook-recoverykey.txt`
    );
    flash("download");
  };

  const handleCopyQRCode = async () => {
    const qrcode = document.getElementById(
      "react-qrcode-logo"
    ) as HTMLCanvasElement | null;
    if (!qrcode) return;

    qrcode.toBlob(async (blob) => {
      if (!blob) return;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } catch {
        if (recoveryKey) await writeText(recoveryKey);
      }
      flash("copyQR");
    });
  };

  const handleDownloadQRCode = async () => {
    const email = (await db.user.getUser())?.email || "user";
    const qrcode = document.getElementById(
      "react-qrcode-logo"
    ) as HTMLCanvasElement | null;
    if (!qrcode) return;

    qrcode.toBlob((blob) => {
      if (!blob) return;

      FileSaver.saveAs(blob, `${email}-notesnook-recoverykey.png`);
      flash("saveQR");
    });
  };

  if (isLoading)
    return <Loader title="Getting encryption key" text="Please wait..." />;

  return (
    <Flex
      data-test-id="step-recovery-final"
      sx={{
        flex: 1,
        flexDirection: "column",
        alignItems: "left",
        width: ["95%", "95%", "65%"],
        maxWidth: "500px",
        alignSelf: "center",
        gap: "spacing13"
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: "spacing9" }}>
        <Button
          type="button"
          variant="new_bordered"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            alignSelf: "flex-start",
            opacity: 0
          }}
        >
          <ChevronLeft size={14} color="icon" />
          <Text
            sx={{
              fontSize: "sm",
              fontWeight: 600,
              color: "heading"
            }}
          >
            {strings.goBack()}
          </Text>
        </Button>
        <Flex
          sx={{
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
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing8",
          bg: "background",
          borderRadius: "radius4",
          width: "100%"
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing7",
            alignItems: "center"
          }}
        >
          <Flex
            sx={{
              flexDirection: "column",
              gap: "spacing6",
              alignItems: "center",
              bg: "background",
              border: "1px solid var(--border)",
              borderRadius: "radius4",
              p: "spacing7",
              boxShadow: "0px 4px 25px 0px rgba(0,0,0,0.04)",
              width: "100%"
            }}
          >
            <CheckCircle size={40} color="accent" />
            <Flex
              sx={{
                flexDirection: "column",
                gap: "spacing3",
                alignItems: "center",
                width: "100%"
              }}
            >
              <Text
                sx={{
                  fontSize: "md",
                  fontWeight: 600,
                  color: "heading",
                  whiteSpace: "nowrap"
                }}
              >
                Password reset successful
              </Text>
              <Text
                sx={{
                  fontSize: "sm",
                  color: "paragraph",
                  fontWeight: 400,
                  textAlign: "center",
                  lineHeight: "1.4"
                }}
              >
                Your password has been updated
              </Text>
            </Flex>
            <Flex
              sx={{
                flexDirection: "column",
                gap: "spacing4",
                bg: "background-secondary",
                px: "spacing3",
                py: "spacing4",
                borderRadius: "radius2",
                width: "100%"
              }}
            >
              <Flex
                sx={{
                  alignItems: "center",
                  gap: "spacing3"
                }}
              >
                <RecoveryKeyShieldCheck size={15} color="accent" />
                <Text
                  sx={{
                    fontSize: "xs",
                    fontWeight: 400,
                    color: "accent"
                  }}
                >
                  Save Your Recovery Key
                </Text>
              </Flex>
              <Flex
                sx={{
                  bg: "background-tertiary",
                  border: "1px dashed var(--accent)",
                  borderRadius: "radius2",
                  p: "spacing4",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%"
                }}
              >
                <ScrollContainer
                  trackStyle={() => ({
                    backgroundColor: "transparent",
                    "--ms-track-size": "3px"
                  })}
                  thumbStyle={() => ({ height: 3 })}
                  style={{ flex: "1 0 0", minWidth: 0 }}
                >
                  <Text
                    sx={{
                      userSelect: "text",
                      lineHeight: 1,
                      color: "paragraph",
                      fontWeight: 400,
                      fontSize: "xxs"
                    }}
                  >
                    {recoveryKey}
                  </Text>
                </ScrollContainer>
                <Flex
                  sx={{
                    alignItems: "center",
                    gap: "spacing3",
                    flexShrink: 0,
                    cursor: "pointer"
                  }}
                  onClick={handleCopy}
                >
                  <Copy size={15} color="accent" />
                  <Text
                    sx={{
                      fontSize: "xs",
                      fontWeight: 500,
                      color: "accent"
                    }}
                  >
                    {activeButton === "copy" ? "Copied!" : "Copy"}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
            <Flex
              sx={{
                flexDirection: "row",
                gap: "spacing4",
                bg: "background-secondary",
                p: "spacing4",
                borderRadius: "radius2",
                width: "100%"
              }}
            >
              <Suspense fallback={<div />}>
                <Flex
                  sx={{
                    position: "relative",
                    bg: "background",
                    border: "1px solid var(--border-secondary)",
                    flexShrink: 0
                  }}
                >
                  <QRCode
                    value={recoveryKey || ""}
                    logoImage={Logo}
                    logoWidth={40}
                    logoHeight={40}
                    ecLevel={"M"}
                    logoPaddingStyle="square"
                  />
                </Flex>
              </Suspense>
              <Flex
                sx={{
                  flex: "1 0 0",
                  flexDirection: "column",
                  gap: "spacing3",
                  justifyContent: "center",
                  minWidth: 0
                }}
              >
                <Button
                  type="button"
                  variant="new_anchor"
                  onClick={handleCopyQRCode}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "spacing3",
                    bg: "background",
                    border: "1px solid var(--border)",
                    borderRadius: "radius2",
                    p: "spacing4",
                    textDecoration: "none",
                    width: "100%"
                  }}
                >
                  <Flex
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "5px",
                      bg: "rgba(0,136,54,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Copy size={15} color="icon" />
                  </Flex>
                  <Text
                    sx={{
                      fontSize: "xs",
                      fontWeight: 500,
                      color: "heading"
                    }}
                  >
                    {activeButton === "copyQR"
                      ? "Copied!"
                      : "Copy to clipboard"}
                  </Text>
                </Button>
                <Button
                  type="button"
                  variant="new_anchor"
                  onClick={handleDownloadQRCode}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "spacing3",
                    bg: "background",
                    border: "1px solid var(--border)",
                    borderRadius: "radius2",
                    p: "spacing4",
                    textDecoration: "none",
                    width: "100%"
                  }}
                >
                  <Flex
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "5px",
                      bg: "rgba(0,136,54,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <FloppyDisk size={15} color="icon" />
                  </Flex>
                  <Text
                    sx={{
                      fontSize: "xs",
                      fontWeight: 500,
                      color: "heading"
                    }}
                  >
                    {activeButton === "saveQR" ? "Saved!" : "Save QR image"}
                  </Text>
                </Button>
                <Button
                  type="button"
                  variant="new_anchor"
                  onClick={handleSaveToFile}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "spacing3",
                    bg: "background",
                    border: "1px solid var(--border)",
                    borderRadius: "radius2",
                    p: "spacing4",
                    textDecoration: "none",
                    width: "100%"
                  }}
                >
                  <Flex
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "5px",
                      bg: "rgba(0,136,54,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Download size={15} color="icon" />
                  </Flex>
                  <Text
                    sx={{
                      fontSize: "xs",
                      fontWeight: 500,
                      color: "heading"
                    }}
                  >
                    {activeButton === "download"
                      ? "Downloaded!"
                      : "Download text file"}
                  </Text>
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Button
          type="button"
          variant="new_accent"
          onClick={handleGoToLogin}
          sx={{
            width: "100%"
          }}
        >
          Go to login
        </Button>
      </Flex>
    </Flex>
  );
}

type RecoveryFormProps<TType extends RecoveryRoutes> = {
  testId: string;
  title: string;
  subtitle: string | JSX.Element;
  loading?: { title: string; subtitle: string };
  type: TType;
  onSubmit: (form: RecoveryFormData[TType]) => Promise<void>;
  children?:
    | React.ReactNode
    | ((form?: RecoveryFormData[TType]) => React.ReactNode);
  onBack?: () => void;
};

export function RecoveryForm<T extends RecoveryRoutes>(
  props: RecoveryFormProps<T>
) {
  const { title, subtitle, children, testId, onBack } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<RecoveryFormData[T] | undefined>();

  if (isSubmitting && props.loading)
    return <Loader title={props.loading.title} text={props.loading.subtitle} />;

  return (
    <AuthFormContext.Provider value={{ error }}>
      <Flex
        ref={formRef}
        data-test-id={testId}
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
          ) as RecoveryFormData[T];
          try {
            setForm(form);
            await props.onSubmit(form);
          } catch (e) {
            console.error(e);
            const error = e as Error;
            setError(error.message);
          } finally {
            setIsSubmitting(false);
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
            variant="new_bordered"
            onClick={onBack}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              alignSelf: "flex-start",
              mb: "spacing9"
            }}
          >
            <ChevronLeft size={14} color="icon" />
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 600,
                color: "heading"
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
        {typeof children === "function" ? children(form) : children}
      </Flex>
    </AuthFormContext.Provider>
  );
}

function openURL(url: string) {
  window.open(url, "_self");
}

function isSessionExpired() {
  return Config.get("sessionExpired", false);
}
