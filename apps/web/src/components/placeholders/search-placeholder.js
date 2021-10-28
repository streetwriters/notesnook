import Placeholder from "./index";

function SearchPlaceholder({ text }) {
  return <Placeholder id="search" text={text || "Nothing to show."} />;
}
export default SearchPlaceholder;
