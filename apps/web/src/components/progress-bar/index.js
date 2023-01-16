/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { useAnimation } from "framer-motion";
import { useEffect } from "react";
import { Flex } from "@theme-ui/components";
import { AnimatedBox } from "../animated";

function ProgressBar(props) {
  const { width, progress, duration = 1, onLoadingEnd, sx } = props;
  const animation = useAnimation();
  useEffect(() => {
    animation.start({ width: `${progress}%`, transition: { duration } });
  }, [animation, progress, duration]);

  return (
    <Flex sx={{ ...sx, width: width, overflow: "hidden" }}>
      <AnimatedBox
        height={5}
        initial={{ width: "0%" }}
        animate={animation}
        bg="primary"
        sx={{ borderRadius: "default" }}
        onAnimationComplete={onLoadingEnd}
      />
    </Flex>
  );
}

export default ProgressBar;
