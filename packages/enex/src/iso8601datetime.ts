/**
 * Javascript has native support for ISO8601 DateTime. However,
 * Evernote's variant excludes separators which makes JS engine
 * output NaN.
 */
export class ISO8601DateTime {
  static toDate(date: string): Date | null {
    if (date.length < 16) return null;

    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    const hour = date.substring(9, 11);
    const minute = date.substring(11, 13);
    const second = date.substring(13, 15);
    const datetime = Date.parse(
      `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
    );

    if (isNaN(datetime)) return null;

    return new Date(datetime);
  }
}
