import { useState } from "react";
import { Text } from "rebass";
import { Perform } from "../../../common/dialog-controller";
import Dialog from "../dialog";
import { steps } from "./steps";
import { AuthenticatorType } from "./types";

type RecoveryCodesDialogProps = {
  onClose: Perform;
  primaryMethod: AuthenticatorType;
};

export default function RecoveryCodesDialog(props: RecoveryCodesDialogProps) {
  const { onClose, primaryMethod } = props;
  const [error, setError] = useState<string>();
  const step = steps.recoveryCodes(primaryMethod);

  return (
    <Dialog
      isOpen={true}
      title={step.title}
      description={step.description}
      width={500}
      positiveButton={{
        text: "Okay",
        onClick: onClose
      }}
    >
      {step.component && (
        <step.component onNext={() => {}} onError={setError} />
      )}
      {error && (
        <Text variant={"error"} bg="errorBg" p={1} mt={2}>
          {error}
        </Text>
      )}
    </Dialog>
  );
}
