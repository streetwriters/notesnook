export function buildTableWithRows(rows: string[]) {
  return `<div class="table-container" contenteditable="false">
    <table contenteditable="true">
      <tbody>
        ${rows.join("")}
      </tbody>
    </table>
  </div>
  <p><br data-mce-bogus="1"/></p>`;
}

export function buildCell(value: string | number, type = "td") {
  return `<${type}>${value || ""}</${type}>`;
}

export function buildRow(cells: string[]) {
  return `<tr>${cells.join("")}</tr>`;
}
