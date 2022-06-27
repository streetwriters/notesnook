import { Box, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { useCallback, useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Button } from "../../components/button";
import { debounce } from "../../utils/debounce";
export const DEFAULT_COLORS = [
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#f44336",
];

type ColorPickerProps = {
  colors?: string[];
  color?: string;
  onClear: () => void;
  expanded?: boolean;
  onChange: (color: string) => void;
  onClose?: () => void;
  title?: string;
};
const PALETTE_SIZE = [35, 35, 25];
export function ColorPicker(props: ColorPickerProps) {
  const {
    colors = DEFAULT_COLORS,
    color,
    onClear,
    onChange,
    title,
    onClose,
    expanded,
  } = props;
  const ref = useRef<HTMLDivElement>();
  const [isPickerOpen, setIsPickerOpen] = useState(expanded || false);
  const [currentColor, setCurrentColor] = useState<string>(
    tinycolor(color || colors[0]).toHexString()
  );
  const tColor = tinycolor(currentColor);

  useEffect(() => {
    if (!ref.current) return;
    if (isPickerOpen) ref.current.focus({ preventScroll: true });
  }, [isPickerOpen]);

  const onColorChange = useCallback(
    debounce((color: string) => {
      onChange(color);
    }, 500),
    [onChange]
  );

  return (
    <Flex
      ref={ref}
      tabIndex={-1}
      sx={{
        bg: "background",
        flexDirection: "column",
        ".react-colorful": {
          width: "auto",
          height: 150,
        },
        ".react-colorful__saturation": {
          borderRadius: ["default", 0],
        },
        width: ["calc(100vw - 20px)", 250],
        //  width: ["auto", 250],
      }}
    >
      {onClose && (
        <Box
          sx={{
            display: ["none", "flex"],
            justifyContent: "space-between",
            p: 2,
            pb: isPickerOpen ? 2 : 0,
            //pb: 0,
            alignItems: "center",
          }}
          onClick={onClose}
        >
          <Text variant={"title"}>{title}</Text>
          <Button variant={"icon"} sx={{ p: 0 }}>
            <Icon path={Icons.close} size="big" />
          </Button>
        </Box>
      )}

      {isPickerOpen ? (
        <>
          <HexColorPicker
            onChange={(color) => {
              setCurrentColor(color);
              onColorChange(color);
            }}
            onTouchEnd={() => onChange(currentColor)}
            onMouseUp={() => onChange(currentColor)}
          />
          <Input
            variant={"clean"}
            placeholder="#000000"
            spellCheck={false}
            sx={{
              my: 2,
              p: 0,
              borderRadius: 0,
              fontSize: ["title", "title", "body"],
              color: "fontTertiary",
              textAlign: "center",
              letterSpacing: 1.5,
            }}
            value={currentColor.toUpperCase()}
            maxLength={7}
            onChange={(e) => {
              const { value } = e.target;
              if (!value) return;
              if (tinycolor(value, { format: "hex" }).isValid()) {
                setCurrentColor(value);
                onChange(value);
              }
            }}
          />
        </>
      ) : null}
      <Flex>
        <Flex
          className="hide-scrollbar"
          sx={{
            flex: 1,
            p: 1,
            overflowX: ["auto", "hidden"],
            flexWrap: ["nowrap", "wrap"],
          }}
        >
          <Button
            variant={"icon"}
            sx={{
              flexShrink: 0,
              width: PALETTE_SIZE,
              height: PALETTE_SIZE,
              borderRadius: 50,
              boxShadow: "menu",
              p: 0,
              ml: [2, 2, 1],
            }}
            onClick={onClear}
          >
            <Icon path={Icons.colorClear} color="text" size={15} />
          </Button>
          <Button
            variant={"secondary"}
            sx={{
              flexShrink: 0,
              bg: currentColor,
              width: PALETTE_SIZE,
              height: PALETTE_SIZE,
              borderRadius: 50,
              // boxShadow: "menu",
              p: 0,
              ml: [2, 2, 1],
            }}
            onClick={() => setIsPickerOpen((s) => !s)}
          >
            <Icon
              path={Icons.palette}
              color={tColor.isDark() ? "static" : "icon"}
              size={18}
            />
          </Button>
          {colors.map((color) => (
            <Button
              key={color}
              variant={"secondary"}
              sx={{
                flex: "0 0 auto",
                bg: color,
                width: PALETTE_SIZE,
                height: PALETTE_SIZE,
                ml: [2, 1, 1],
                mb: [0, 1, 1],
                borderRadius: 50,
                //   boxShadow: "menu",
              }}
              onClick={() => {
                setCurrentColor(color);
                onChange(color);
              }}
            />
          ))}
        </Flex>
        {onClose && (
          <Button
            variant={"icon"}
            sx={{ display: ["block", "none"], px: 2 }}
            onClick={onClose}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <Icon path={Icons.close} size="big" />
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
