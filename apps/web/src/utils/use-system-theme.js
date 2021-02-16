import useMediaQuery from "./use-media-query";

const useSystemTheme = () => useMediaQuery("(prefers-color-scheme: dark)");
export default useSystemTheme;
