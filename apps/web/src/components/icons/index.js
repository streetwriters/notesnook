import React from "react";
import MDIIcon from "@mdi/react";
import * as Icons from "@mdi/js";
import { motion } from "framer-motion";
import { useTheme } from "emotion-theming";
import Animated from "../animated";

const Icon = ({ name, size = 24, color = "text" }) => {
  const theme = useTheme();
  return (
    <MDIIcon
      path={name}
      size={size + "px"}
      color={theme.colors[color] || color}
    />
  );
};

const createIcon = name => {
  return props => (
    <Animated.Box
      sx={props.sx}
      height={(props.size || 24) + "px"}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Icon name={name} {...props} />
    </Animated.Box>
  );
};

export const Plus = createIcon(Icons.mdiPlus);
export const Minus = createIcon(Icons.mdiMinus);
export const Notebook = createIcon(Icons.mdiBookOutline);
export const ArrowLeft = createIcon(Icons.mdiArrowLeft);
export const Move = createIcon(Icons.mdiArrowAll);
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
export const Menu = createIcon(Icons.mdiHamburger);
export const Login = createIcon(Icons.mdiLogin);
export const FocusMode = createIcon(Icons.mdiFullscreen);
export const NormalMode = createIcon(Icons.mdiFullscreenExit);
export const Settings = createIcon(Icons.mdiCogOutline);
export const Home = createIcon(Icons.mdiHomeOutline);
export const Restore = createIcon(Icons.mdiRecycle);

/** Properties Icons */
export const ChevronLeft = createIcon(Icons.mdiChevronLeft);
export const Close = createIcon(Icons.mdiClose);
export const Tag = createIcon(Icons.mdiTagOutline);
export const Color = createIcon(Icons.mdiSelectColor);
export const Pin = createIcon(Icons.mdiPinOutline);

/** Settings Icons */
export const User = createIcon(Icons.mdiAccountOutline);
export const Theme = createIcon(Icons.mdiThemeLightDark);
export const Checkmark = createIcon(Icons.mdiCheck);
