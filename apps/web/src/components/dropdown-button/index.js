import { Button, Flex } from "rebass";
import { useMenuTrigger } from "../../hooks/use-menu";
import { ChevronDown } from "../icons";

export default function DropdownButton({ title, options }) {
  const { openMenu } = useMenuTrigger();

  if (!options || !options.length) return null;
  return (
    <Flex>
      <Button
        sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        onClick={options[0].onClick}
      >
        {options[0].title()}
      </Button>
      {options.length > 1 && (
        <Button
          px={1}
          sx={{
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
          }}
          onClick={() => openMenu(options.slice(1), { title })}
        >
          <ChevronDown color="static" size={18} />
        </Button>
      )}
    </Flex>
  );
}
