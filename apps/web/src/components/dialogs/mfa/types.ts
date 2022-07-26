import { BoxProps } from "rebass";
import { Perform } from "../../../common/dialog-controller";

export type AuthenticatorType = "app" | "sms" | "email";

export type Authenticator = {
  type: AuthenticatorType;
  title: string;
  subtitle: string;
  icon: React.FunctionComponent<BoxProps>;
  recommended?: boolean;
};

export type StepComponentProps = {
  onNext: (...args: any[]) => void;
  onClose?: Perform;
  onError?: (error: string) => void;
};

export type StepComponent = React.FunctionComponent<StepComponentProps>;

export type SubmitCodeFunction = (code: string) => void;
