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
import { Flex, Input, Label } from "@theme-ui/components";
import { useStore } from "../../../stores/setting-store";
import { useEffect, useState } from "react";

export function ProxyInput() {
  const proxyRules = useStore((store) => store.proxyRules);
  const setProxyRules = useStore((store) => store.setProxyRules);
  const [proxy, setProxy] = useState("");
  const [port, setPort] = useState("");

  useEffect(() => {
    if (proxyRules) {
      const _proxyRules = proxyRules.split(":");
      setPort(_proxyRules[_proxyRules.length - 1]);
      let _proxy = "";
      for (let i = 0; i < _proxyRules.length - 1; i++)
        if (i === 0) _proxy = _proxy + _proxyRules[i];
        else _proxy = _proxy + ":" + _proxyRules[i];
      console.log("proxy", _proxy);
      setProxy(_proxy);
    }
  }, []);

  useEffect(() => {
    if (
      proxy === "" ||
      port === "" ||
      proxy === undefined ||
      port === undefined
    )
      setProxyRules(undefined);
    else setProxyRules(`${proxy}:${port}`);
    console.log("proxy,port", proxy, port, proxyRules);
  }, [proxy, port, setProxyRules]);

  return (
    <Flex my={20} sx={{ width: "100%", alignItems: "center" }}>
      <Label title="Proxy" sx={{ width: "7.5%", justifyContent: "center" }}>
        Proxy
      </Label>
      <Input
        sx={{ width: "50%" }}
        defaultValue={proxy}
        onChange={(e) => {
          setProxy(e.target.value);
        }}
      ></Input>
      <Label title="Port" sx={{ width: "7.5%", justifyContent: "center" }}>
        Port
      </Label>
      <Input
        sx={{ maxWidth: "7.5%" }}
        defaultValue={port}
        onChange={(e) => {
          setPort(e.target.value);
        }}
      ></Input>
    </Flex>
  );
}
