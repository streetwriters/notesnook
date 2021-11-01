import ReactToggle from "react-toggle";
import "react-toggle/style.css";
import "./style.css";

function Switch({ checked, onClick }) {
  return (
    <ReactToggle
      size={20}
      onChange={() => {}}
      onClick={onClick}
      checked={checked}
      icons={false}
    />
  );
}
export default Switch;
