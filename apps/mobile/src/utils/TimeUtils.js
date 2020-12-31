export const sleep = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));

export function timeSince(date) {
  let seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);

  if (interval > 0.9) {
    return interval < 2 ? interval + ' year ago' : interval + ' years ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' month ago' : interval + ' months ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' day ago' : interval + ' days ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' hour ago' : interval + ' hours ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' min ago' : interval + ' min ago';
  }
  return Math.floor(seconds) < 0
    ? '0 secs ago'
    : Math.floor(seconds) + ' secs ago';
}

export const timeConverter = (timestamp) => {
  if (!timestamp) return;
  let d = new Date(timestamp), // Convert the passed timestamp to milliseconds
    yyyy = d.getFullYear(),
    mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
    dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
    currentDay = d.getDay(),
    hh = d.getHours(),
    h = hh,
    min = ('0' + d.getMinutes()).slice(-2), // Add leading 0.
    ampm = 'AM',
    time;
  let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  if (hh > 12) {
    h = hh - 12;
    ampm = 'PM';
  } else if (hh === 12) {
    h = 12;
    ampm = 'PM';
  } else if (hh === 0) {
    h = 12;
  }

  // ie: 2013-02-18, 8:35 AM
  time =
    days[currentDay] +
    ' ' +
    dd +
    ' ' +
    months[d.getMonth()] +
    ', ' +
    yyyy +
    ', ' +
    h +
    ':' +
    min +
    ' ' +
    ampm;

  return time;
};
