import { Editor } from "notesnook-editor";

type ButtonType = {
  editor: Editor | null;
  title: string;
  onPress: () => void;
  marginRight?: number;
  activeKey: string;
};

export default function Button({
  editor,
  title,
  onPress,
  marginRight = 10,
  activeKey,
}: ButtonType) {
  const active = editor?.isActive(activeKey);

  return (
    <button
      style={{
        width: 40,
        height: 40,
        borderWidth: 0,
        background: active ? "var(--nn_transGray)" : "var(--nn_nav)",
        borderRadius: 5,
        fontWeight: "bold",
        userSelect: "none",
        color: active ? "var(--nn_accent)" : "var(--nn_pri)",
        marginRight: marginRight,
        fontSize: 18,
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      onMouseDown={(e) => e.preventDefault()}
      onTouchEnd={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={active ? "is-active" : ""}
    >
      {title}
    </button>
  );
}
