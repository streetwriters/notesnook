import { Flex, Text } from "rebass";
import { useStore } from "../../stores/editor-store";
import Switch from "../switch";

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
      <Switch onClick={() => onToggle(!isOn)} checked={isOn} />
    </Flex>
  );
}
export default Toggle;
