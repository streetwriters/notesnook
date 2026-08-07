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

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { makeURL, useQueryParams } from "../navigation";
import { db } from "../common/db";
import { Loader } from "../components/loader";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";
import {
  AuthField,
  AuthFormContainer,
  AuthFormContainerProps,
  SubmitButton
} from "./auth";
import Config from "../utils/config";
import { User } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useKeyStore } from "../interfaces/key-store";
import { ScrollContainer } from "@notesnook/ui";
import Logo from "../assets/notesnook-logo.png";
import {
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
import { SaveRecoveryKey } from "../dialogs/recovery-key-dialog";

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
  code?: string;
  userId?: string;
}) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState<User>();
  useEffect(() => {
    async function authenticateUser() {
      if (!code || !userId) {
        openURL("/");
        return;
      }

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
            mt: index === 0 ? 0 : "spacing4"
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

  return (
    <RecoveryForm
      testId="step-recovery-key"
      type="method:key"
      title={strings.accountRecovery()}
      subtitle={strings.accountRecoveryWithKey()}
      onBack={() => navigate("methods")}
      onSubmit={async (form) => {
        const recoveryKey = form.recoveryKey;

        // TODO: re-enable once UI testing is done
        // if (recoveryKey.length < 40) {
        //   throw new Error(strings.invalidRecoveryKey());
        // }

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

  return (
    <RecoveryForm
      testId="step-new-password"
      type="new"
      title={strings.resetAccountPassword()}
      subtitle={strings.accountPassDesc()}
      onBack={() =>
        navigate(
          formData?.userResetRequired ? "methods" : "method:key",
          formData
        )
      }
      onSubmit={async (form) => {
        try {
          if (form.password !== form.confirmPassword)
            throw new Error("Passwords do not match.");

          // TODO: re-enable once UI testing is done
          // if (formData?.userResetRequired && !(await db.user.resetUser()))
          //   throw new Error("Failed to reset user.");

          // if (!(await db.user.resetPassword(form.password)))
          //   throw new Error("Could not reset account password.");

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
      {(form, options) => (
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
          <SubmitButton
            loading={options?.loading}
            text={
              options?.loading
                ? strings.resettingAccountPassword()
                : strings.continue()
            }
          />
        </>
      )}
    </RecoveryForm>
  );
}

function Final(_props: BaseRecoveryComponentProps<"final">) {
  const [recoveryKey, setRecoveryKey] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading)
    return <Loader title="Getting encryption key" text="Please wait..." />;

  return (
    <RecoveryForm
      testId="step-new-password"
      type="new"
      title={""}
      subtitle={<></>}
      onSubmit={async () => {}}
    >
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing8",
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
          <SaveRecoveryKey recoveryKey={recoveryKey} />
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
    </RecoveryForm>
  );
}

function RecoveryForm<T extends RecoveryRoutes>(
  props: AuthFormContainerProps<T, RecoveryFormData>
) {
  return <AuthFormContainer {...props} />;
}

function openURL(url: string) {
  window.open(url, "_self");
}

function isSessionExpired() {
  return Config.get("sessionExpired", false);
}
