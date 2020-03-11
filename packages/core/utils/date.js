function getWeeksInMonth(month, year, _start) {
  let weeks = [],
    firstDate = new Date(year, month, 1),
    lastDate = new Date(year, month + 1, 0),
    numDays = lastDate.getDate();

  let start = 1;
  let end = 7 - firstDate.getDay();
  if (firstDate.getDay() === _start) {
    end = 7;
  } else {
    let preMonthEndDay = new Date(year, month, 0);
    start = preMonthEndDay.getDate() + 1 - firstDate.getDay() + _start;
    end = 7 - firstDate.getDay() + _start;
    weeks.push({
      start: new Date(
        preMonthEndDay.getFullYear(),
        preMonthEndDay.getMonth(),
        start
      ),
      end: new Date(year, month, end)
    });
    start = end + 1;
    end = end + 7;
  }
  while (start <= numDays) {
    weeks.push({
      start: new Date(year, month, start),
      end: new Date(year, month, end)
    });
    start = end + 1;
    end = end + 7;
    if (end > numDays) {
      end = end - numDays + _start;
      weeks.push({
        start: new Date(year, month, start),
        end: new Date(year, month + 1, end)
      });
      break;
    }
  }
  return weeks;
}

function getWeeksInYear(year) {
  let weeks = [];
  for (let i = 0; i <= 11; i++) {
    weeks = weeks.concat(...getWeeksInMonth(i, year, 0));
  }
  return weeks;
}

export function get7DayTimestamp() {
  return 604800000;
}

export function getLastWeekTimestamp() {
  const t = new Date().getDate() + (6 - new Date().getDay() - 1) - 6;
  const lastSaturday = new Date();
  return lastSaturday.setDate(t);
}
export const months = [
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
  "Dec"
];
let years = {};
export function getWeekGroupFromTimestamp(timestamp) {
  let date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  if (!years.hasOwnProperty(date.getFullYear())) {
    years[date.getFullYear()] = getWeeksInYear(date.getFullYear());
  }
  let weeks = years[date.getFullYear()];

  let week = weeks.find(v => date >= v.start && date <= v.end);
  //Format: {month} {start} - {end}, {year}
  return `${
    months[week.start.getMonth()]
  } ${week.start.getDate()}, ${week.start.getFullYear()} -  ${
    months[week.end.getMonth()]
  } ${week.end.getDate()}, ${week.end.getFullYear()}`;
}
