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

import { useState } from "react";
import { Text } from "@theme-ui/components";
import { Perform } from "../../common/dialog-controller";
import Dialog from "../../components/dialog";
import {
  AuthenticatorOnNext,
  AuthenticatorTypeOnNext,
  FallbackStep,
  fallbackSteps,
  Step,
  steps
} from "./steps";
import { Authenticator, AuthenticatorType, OnNextFunction } from "./types";

type MultifactorDialogProps = {
  onClose: Perform;
  primaryMethod?: AuthenticatorType;
};

export default function MultifactorDialog(props: MultifactorDialogProps) {
  const { onClose, primaryMethod } = props;
  const [step, setStep] = useState<
    | Step<AuthenticatorOnNext>
    | Step<AuthenticatorTypeOnNext>
    | FallbackStep<OnNextFunction>
  >(primaryMethod ? fallbackSteps.choose(primaryMethod) : steps.choose());
  const [error, setError] = useState<string>();

  if (!step) return null;
  return (
    <Dialog
      isOpen={true}
      title={step.title}
      description={step.description}
      width={500}
      positiveButton={
        step.next
          ? {
              text: "Continue",
              form: "2faForm"
            }
          : null
      }
      negativeButton={
        step.cancellable
          ? {
              text: "Cancel",
              onClick: () => props.onClose(false)
            }
          : null
      }
    >
      {step.component && (
        <step.component
          onNext={(arg: AuthenticatorType | Authenticator) => {
            if (!step.next) return onClose(true);

            const nextStep =
              step.next !== "recoveryCodes" && primaryMethod
                ? fallbackSteps[step.next](
                    arg as AuthenticatorType & Authenticator,
                    primaryMethod
                  )
                : steps[step.next](arg as AuthenticatorType & Authenticator);

            setStep(nextStep);
          }}
          onError={setError}
          onClose={onClose}
        />
      )}
      {error && (
        <Text variant={"error"} bg="errorBg" p={1} mt={2}>
          {error}
        </Text>
      )}
    </Dialog>
  );
}
