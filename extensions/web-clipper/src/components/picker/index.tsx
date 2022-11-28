import { PropsWithChildren } from "react";
import Modal from "react-modal";
import { Flex } from "@theme-ui/components";
import { ThemeProvider } from "../theme-provider";
Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    boxShadow: "0px 1px 10px var(--info)",
    border: "none",
    borderRadius: 5,
    backgroundColor: "var(--background)",
    padding: "10px",

    height: "80vh",
    width: "85vw",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  } as const
};

type PickerProps = {
  isOpen: boolean;
  onClose: () => void;
};
export const Picker = (props: PropsWithChildren<PickerProps>) => {
  const { children, isOpen, onClose } = props;

  return (
    <Modal
      style={{
        content: customStyles.content,
        overlay: {
          backgroundColor: "var(--overlay)"
        }
      }}
      onRequestClose={onClose}
      isOpen={isOpen}
    >
      <ThemeProvider>
        <Flex
          sx={{
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {children}
        </Flex>
      </ThemeProvider>
    </Modal>
  );
};
