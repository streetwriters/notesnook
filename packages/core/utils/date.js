import dayjs from "dayjs";

export function getWeekGroupFromTimestamp(timestamp) {
  const date = dayjs(timestamp);
  const start = date.startOf("week");
  const end = date.endOf("week");
  const startMonth = start.month() === end.month() ? "" : " MMM";
  const startYear = start.year() === end.year() ? "" : ", YYYY";
  return `${start.format(`DD${startMonth}${startYear}`)} - ${end.format(
    "DD MMM, YYYY"
  )}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
