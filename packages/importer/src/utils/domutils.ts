import { HTMLElement, parse } from "node-html-parser";

export type Row = {
  cells: Cell[];
};
export type Cell = {
  type: "td" | "th";
  value: string;
};

export function getAttribute<T>(
  element: HTMLElement,
  key: string,
  type: "number" | "string" = "string"
): T | undefined {
  const value = element.getAttribute(key);
  if (!value) return;

  switch (type) {
    case "number": {
      const int = parseInt(value);
      if (isNaN(int)) return;
      return <T>(<unknown>int);
    }
    default:
      return <T>(<unknown>value);
  }
}

export function buildTable(rows: Row[]): string {
  const document = parse(`<table><tbody></tbody></table>`);
  const tbody = <HTMLElement>document.querySelector("tbody")!;

  for (let row of rows) {
    const rowElement = document.createElement("tr");
    for (let cell of row.cells) {
      const cellElement = document.createElement(cell.type);
      cellElement.innerHTML = cell.value;
      rowElement.appendChild(cellElement);
    }
    tbody.appendChild(rowElement);
  }

  return document.outerHTML;
}

export function buildCodeblock(code: string, language: string) {
  const document = parse(`<pre></pre>`);
  const pre = <HTMLElement>document.firstChild;
  pre.classList.add("hljs");
  pre.classList.add(`language-${language}`);
  pre.innerHTML = code;
  return document.outerHTML;
}
