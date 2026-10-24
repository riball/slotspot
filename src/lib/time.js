// All times are local Bengaluru time, stored as plain DATETIME values.
// Setting TZ here means every Date in the app uses the same zone.
process.env.TZ = process.env.TZ || 'Asia/Kolkata';

const pad = (n) => String(n).padStart(2, '0');

// Date -> 'YYYY-MM-DD HH:MM:SS' in local time
function toSql(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 'YYYY-MM-DD HH:MM' or 'YYYY-MM-DD HH:MM:SS' -> local Date
function parseSql(value) {
  const [datePart, timePart = '00:00:00'] = value.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss = 0] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, ss);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

// Date -> 'HH:MM' for display
function hhmm(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = { toSql, parseSql, addMinutes, hhmm };
