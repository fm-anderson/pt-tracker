export function formatTime(ms) {
  const date = new Date(ms);
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const msPart = String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0');
  return `${mm}:${ss}.${msPart}`;
}
