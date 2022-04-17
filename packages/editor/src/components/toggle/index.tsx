import ReactToggle, { ToggleProps } from "react-toggle";
import "react-toggle/style.css";

const css = `.react-toggle {
    display: flex;
    align-items: center;
  }
  
  .react-toggle-thumb {
    box-shadow: none;
  }
  
  .react-toggle-track {
    width: 30px;
    height: 18px;
  }
  
  .react-toggle-thumb {
    width: 16px;
    height: 16px;
    top: 0px;
    left: 1px;
    margin-top: 1px;
  }
  
  .react-toggle--checked .react-toggle-thumb {
    left: 13px;
    border-color: var(--primary);
  }
  
  .react-toggle:active:not(.react-toggle--disabled) .react-toggle-thumb {
    box-shadow: none;
  }
  
  .react-toggle--focus .react-toggle-thumb {
    box-shadow: none;
  }
  `;
export function Toggle(props: ToggleProps) {
  return (
    <>
      <style>{css}</style>
      <ReactToggle size={20} onChange={() => {}} icons={false} {...props} />
    </>
  );
}
