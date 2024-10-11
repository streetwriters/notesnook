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
import Dialog from "../../components/dialog";
import {
  AuthenticatorOnNext,
  AuthenticatorTypeOnNext,
  FallbackStep,
  fallbackSteps,
  Step,
  steps
} from "./steps";
import { Authenticator, OnNextFunction } from "./types";
import { ErrorText } from "../../components/error-text";
import { AuthenticatorType } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import { strings } from "@notesnook/intl";

type MultifactorDialogProps = BaseDialogProps<boolean> & {
  primaryMethod?: AuthenticatorType;
};

export const MultifactorDialog = DialogManager.register(
  function MultifactorDialog(props: MultifactorDialogProps) {
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
                text: strings.continue(),
                form: "2faForm"
              }
            : null
        }
        negativeButton={
          step.cancellable
            ? {
                text: strings.cancel(),
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
        <ErrorText error={error} />
      </Dialog>
    );
  }
);
