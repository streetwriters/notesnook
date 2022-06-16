export function getWeekGroupFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const { start, end } = getWeek(date);

  const startMonth =
    start.month !== end.month ? " " + MONTHS_SHORT[start.month] : "";
  const startYear = start.year !== end.year ? ", " + start.year : "";

  const startDate = `${start.day}${startMonth}${startYear}`;
  const endDate = `${end.day} ${MONTHS_SHORT[end.month]}, ${end.year}`;

  return `${startDate} - ${endDate}`;
}

const MS_IN_HOUR = 3600000;
/**
 *
 * @param {Date} date
 * @returns
 */
function getWeek(date) {
  var day = date.getDay() || 7;
  if (day !== 1) {
    const hours = 24 * (day - 1);
    date.setTime(date.getTime() - MS_IN_HOUR * hours);
  }
  const start = {
    month: date.getMonth(),
    year: date.getFullYear(),
    day: date.getDate(),
  };

  const hours = 24 * 6;
  date.setTime(date.getTime() + MS_IN_HOUR * hours);

  const end = {
    month: date.getMonth(),
    year: date.getFullYear(),
    day: date.getDate(),
  };

  return { start, end };
}

/**
 *
 * @param {number} date
 * @param {Intl.DateTimeFormatOptions} options
 * @returns
 */
export function formatDate(
  date,
  options = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  return new Date(date).toLocaleString(undefined, options);
}

export const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
