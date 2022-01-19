
export function buildTableWithRows(rows: string) {
    return `<div class="table-container" contenteditable="false">
    <table contenteditable="true">
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  <p><br data-mce-bogus="1"/></p>`;
  }