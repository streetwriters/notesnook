import React from "react";
import TitleBox from "./title-box";
import { useStore } from "../../stores/editor-store";

function Header() {
  const title = useStore((store) => store.session.title);

  const setSession = useStore((store) => store.setSession);

  return (
    <TitleBox
      title={title}
      changeInterval={500}
      setTitle={(title) =>
        setSession((state) => {
          state.session.title = title;
        })
      }
    />
  );
}
export default Header;
