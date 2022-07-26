import { useState } from "react";
import { Text } from "rebass";
import { Perform } from "../../../common/dialog-controller";
import Dialog from "../dialog";
import { FallbackStep, fallbackSteps, Step, steps } from "./steps";
import { AuthenticatorType } from "./types";

type MultifactorDialogProps = {
  onClose: Perform;
  primaryMethod?: AuthenticatorType;
};

export default function MultifactorDialog(props: MultifactorDialogProps) {
  const { onClose, primaryMethod } = props;
  const [step, setStep] = useState<FallbackStep | Step>(
    primaryMethod ? fallbackSteps.choose(primaryMethod) : steps.choose()
  );
  const [error, setError] = useState<string>();

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
              props: { form: "2faForm" },
            }
          : null
      }
      negativeButton={
        step.cancellable
          ? {
              text: "Cancel",
              onClick: onClose,
            }
          : null
      }
    >
      {step.component && (
        <step.component
          onNext={(...args) => {
            if (!step.next) return onClose(true);

            const nextStepCreator: Function =
              step.next !== "recoveryCodes" && primaryMethod
                ? fallbackSteps[step.next]
                : steps[step.next];

            const nextStep = primaryMethod
              ? nextStepCreator(...args, primaryMethod)
              : nextStepCreator(...args);

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
