function getWeeksInMonth(month, year) {
  var weeks = [],
    firstDate = new Date(year, month, 1),
    lastDate = new Date(year, month + 1, 0),
    numDays = lastDate.getDate();

  var start = 1;
  var end = 7 - firstDate.getDay();
  while (start <= numDays) {
    weeks.push({
      start: new Date(year, month, start),
      end: new Date(year, month, end)
    });
    start = end + 1;
    end = end + 7;
    if (end > numDays) end = numDays;
  }
  return weeks;
}

function getWeeksInYear(year) {
  let weeks = [];
  for (let i = 0; i <= 11; i++) {
    weeks.concat(...getWeeksInMonth(i, year));
  }
  return weeks;
}

/* function getDayTimestamp(last) {
  to = new Date().getDate() - last;
  date = new Date();
  return date.setDate(to);
} */

export function getLastWeekTimestamp() {
  const t = new Date().getDate() + (6 - new Date().getDay() - 1) - 6;
  const lastSaturday = new Date();
  return lastSaturday.setDate(t);
}
export const months = [
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
  "December"
];
let years = {};
export function getWeekGroupFromTimestamp(timestamp) {
  let date = new Date(timestamp);

  if (!years.hasOwnProperty(date.getFullYear())) {
    years[date.getFullYear()] = getWeeksInYear(date.getFullYear());
  }
  let weeks = years[date.getFullYear()];

  let week = weeks.find(v => date >= v.start && date <= v.end);

  //Format: {month} {start} - {end}, {year}
  return `${months[date.getMonth()]} ${week.start} - ${
    week.end
  }, ${date.getFullYear()}`;
}
