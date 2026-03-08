/** Format milliseconds as MM:SS.d (e.g. 01:23.4) */
export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${tenths}`;
}

/** Format milliseconds as seconds string (e.g. "2.50s") */
export function formatTimeSec(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}
