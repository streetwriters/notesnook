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

import type * as Contract from "../../../ui/dialog";

export function DialogButton(props: Contract.DialogButtonProps) {
  return (
    <button
      data-test-id={props.testID}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.text}
    </button>
  );
}

export function Dialog(props: Contract.DialogProps) {
  if (props.isOpen === false) return null;
  return (
    <div
      data-test-id={props.testID}
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onClose?.();
      }}
    >
      <div
        style={{ width: props.width ?? 480, maxHeight: props.height ?? "70%" }}
      >
        {props.title ? (
          <h2 data-test-id="dialog-title">{props.title}</h2>
        ) : null}
        {props.description ? <p>{props.description}</p> : null}
        {props.children}
        {props.negativeButton ? (
          <DialogButton {...props.negativeButton} />
        ) : null}
        {props.positiveButton ? (
          <DialogButton {...props.positiveButton} />
        ) : null}
        {props.footer}
      </div>
    </div>
  );
}
