//COLOR SCHEME

export function setColorScheme(
    night = false,
    bg = "white",
    fg = "#189ad3",
    nav = "#f2f2f2",
    pri = "black",
    sec = "white",
    accent = "#189ad3",
    normal = "black",
    icon = ICONS_COLOR
) {
    COLOR_SCHEME.bg = bg;
    COLOR_SCHEME.fg = fg;
    COLOR_SCHEME.nav = nav;
    COLOR_SCHEME.pri = pri;
    COLOR_SCHEME.sec = sec;
    COLOR_SCHEME.accent = accent;
    COLOR_SCHEME.normal = normal;
    COLOR_SCHEME.night = night;
    COLOR_SCHEME.icon = icon;

    return;
}

export const COLOR_SCHEME = {
    night: false,
    bg: "white",
    fg: "#189ad3",
    navbg: "#f2f2f2",
    pri: "black",
    sec: "white",
    accent: "#189ad3",
    normal: "black",
    icon: "gray"
};

//FONT FAMILY
export const FONT = "";
export const FONT_BOLD = "";

//FONT SIZE

export const SIZE = {
    xxs: 10,
    xs: 12,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 34,
    xxxl: 40
}



