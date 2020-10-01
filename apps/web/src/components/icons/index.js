import React from "react";
import MDIIcon from "@mdi/react";
import * as Icons from "@mdi/js";
import { useTheme } from "emotion-theming";
import Animated from "../animated";

function Icon({ name, size = 24, color = "icon", stroke, rotate }) {
  const theme = useTheme();
  return (
    <MDIIcon
      path={name}
      size={size + "px"}
      stroke={stroke}
      color={theme.colors[color] || color}
      spin={rotate}
    />
  );
}

function createIcon(name, rotate = false) {
  return function (props) {
    return (
      <Animated.Box
        variant={props.variant}
        height={(props.size || 24) + "px"}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        animate={props.animation}
        onClick={props.onClick}
        data-test-id={props["data-test-id"]}
        sx={props.sx}
      >
        <Icon name={name} rotate={rotate} {...props} />
      </Animated.Box>
    );
  };
}

export const Plus = createIcon(Icons.mdiPlus);
export const Minus = createIcon(Icons.mdiMinus);
export const Notebook = createIcon(Icons.mdiBookOutline);
export const ArrowLeft = createIcon(Icons.mdiArrowLeft);
export const ArrowRight = createIcon(Icons.mdiArrowRight);
export const Move = createIcon(Icons.mdiBookPlusMultipleOutline);
export const Topic = createIcon(Icons.mdiFormatTitle);
export const Alert = createIcon(Icons.mdiAlert);
export const Vault = createIcon(Icons.mdiShieldOutline);
export const Unlock = createIcon(Icons.mdiLockOpenOutline);
export const Lock = createIcon(Icons.mdiLock);
export const Star = createIcon(Icons.mdiStar);
export const StarOutline = createIcon(Icons.mdiStarOutline);
export const Circle = createIcon(Icons.mdiCircle);
export const CircleEmpty = createIcon(Icons.mdiCircleOutline);
export const Check = createIcon(Icons.mdiCheckCircleOutline);
export const MoreVertical = createIcon(Icons.mdiDotsVertical);
export const Trash = createIcon(Icons.mdiTrashCanOutline);
export const Search = createIcon(Icons.mdiMagnify);
export const Menu = createIcon(Icons.mdiMenu);
export const Login = createIcon(Icons.mdiLoginVariant);
export const Signup = createIcon(Icons.mdiAccountPlusOutline);
export const Logout = createIcon(Icons.mdiLogoutVariant);
export const FocusMode = createIcon(Icons.mdiFullscreen);
export const NormalMode = createIcon(Icons.mdiFullscreenExit);
export const Settings = createIcon(Icons.mdiCogOutline);
export const Home = createIcon(Icons.mdiHomeOutline);
export const Restore = createIcon(Icons.mdiRecycle);
export const Sync = createIcon(Icons.mdiSync);
export const Loading = createIcon(Icons.mdiLoading, true);
export const Export = createIcon(Icons.mdiExportVariant);
export const AddToNotebook = createIcon(Icons.mdiBookPlusMultipleOutline);

/** Properties Icons */
export const ChevronLeft = createIcon(Icons.mdiChevronLeft);
export const ChevronRight = createIcon(Icons.mdiChevronRight);
export const Close = createIcon(Icons.mdiClose);
export const Tag = createIcon(Icons.mdiTagTextOutline);
export const Pin = createIcon(Icons.mdiPinOutline);
export const PinFilled = createIcon(Icons.mdiPin);

/** Settings Icons */
export const User = createIcon(Icons.mdiAccountOutline);
export const DarkMode = createIcon(Icons.mdiWeatherNight);
export const LightMode = createIcon(Icons.mdiWeatherSunny);
export const Theme = createIcon(Icons.mdiThemeLightDark);
export const Checkmark = createIcon(Icons.mdiCheck);

export const Properties = createIcon(Icons.mdiDotsHorizontal);

// FORMATS

export const Markdown = createIcon(Icons.mdiLanguageMarkdownOutline);
export const HTML = createIcon(Icons.mdiLanguageHtml5);
export const Text = createIcon(Icons.mdiFormatTitle);

// TOAST
export const Success = createIcon(Icons.mdiCheckCircle);
export const Error = createIcon(Icons.mdiAlertCircle);
export const Warn = createIcon(Icons.mdiAlert);
export const Info = createIcon(Icons.mdiInformation);

export const ToggleUnchecked = createIcon(Icons.mdiToggleSwitchOff);
export const ToggleChecked = createIcon(Icons.mdiToggleSwitch);
