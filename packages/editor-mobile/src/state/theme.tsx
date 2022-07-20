import create, { State } from "zustand";
import { injectCss, transform } from "../utils/css";
type Colors = {
  night: boolean;
  bg: string;
  navbg: string;
  input: string;
  nav: string;
  heading: string;
  pri: string;
  sec: string;
  light: string;
  transGray: string;
  accent: string;
  shade: string;
  fg: string;
  normal: string;
  errorText: string;
  successBg: string;
  successText: string;
  warningBg: string;
  warningText: string;
  red: string;
  orange: string;
  yellow: string;
  green: string;
  blue: string;
  purple: string;
  gray: string;
  discord: string;
  border: string;
  placeholder: string;
};

const DefaultColors = {
  accent: "#008837",
  shade: "#00883712",
  fg: "#008837",
  normal: "black",
  icon: "gray",
  transGray: "#00000010",
  errorBg: "#FFB6C1",
  errorText: "#ff6961",
  successBg: "#DFF2BF",
  successText: "#4F8A10",
  warningBg: "#FF990020",
  warningText: "#FF9900",
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E",
  discord: "#5865F2",
  night: false,
  bg: "#ffffff",
  navbg: "#f7f7f7",
  nav: "#f7f7f7",
  pri: "#424242",
  sec: "white",
  light: "#ffffff",
  input: "transparent",
  heading: "#212121",
  border: "#E8E8E8",
  placeholder: "#a9a9a9",
};

injectCss(transform(DefaultColors));
interface ThemeState extends State {
  colors: Colors;
  setColors: (colors: Colors) => void;
}

export const useEditorThemeStore = create<ThemeState>((set, get) => ({
  colors: DefaultColors,
  setColors: (colors) => {
    injectCss(transform(colors));
    set({ colors: colors });
  },
}));
