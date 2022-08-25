import useMediaQuery from "./use-media-query";

const useTablet = () =>
  useMediaQuery("(min-width: 480px) and (max-width: 1000px)");
export default useTablet;
