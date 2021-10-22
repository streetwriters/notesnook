import { Flex, Text } from "rebass";
import { useStore } from "../../stores/editor-store";
import ReactToggle from "react-toggle";
import "react-toggle/style.css";
import "./toggle.css";

function Toggle(props) {
  const { icon: ToggleIcon, label, onToggle, toggleKey } = props;
  const isOn = useStore((store) => store.session[toggleKey]);
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      py={2}
      px={2}
      sx={{
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
      }}
      onClick={() => onToggle(!isOn)}
      data-test-id={props.testId}
    >
      <Text display="flex" alignItems="center" variant="body" color="text">
        <ToggleIcon size={13} sx={{ flexShrink: 0, mr: 1 }} />
        {label}
      </Text>
      <ReactToggle size={20} checked={isOn} icons={false} />
    </Flex>
  );
}
export default Toggle;
