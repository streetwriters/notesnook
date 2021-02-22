import React from "react";
import { Flex } from "rebass";
import TitleBox from "./title-box";
import { useStore, SESSION_STATES } from "../../stores/editor-store";

function Header() {
  const title = useStore((store) => store.session.title);

  const sessionState = useStore((store) => store.session.state);
  const setSession = useStore((store) => store.setSession);

  return (
    <Flex mx={2} mb={[2, 2, 0]}>
      <TitleBox
        shouldFocus={sessionState === SESSION_STATES.new && title.length <= 0}
        title={title}
        changeInterval={500}
        setTitle={(title) =>
          setSession((state) => {
            state.session.title = title;
          })
        }
      />
    </Flex>
  );
}
export default Header;
