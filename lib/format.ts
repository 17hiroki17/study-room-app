// 表示用のフォーマット関数（日本語表記）

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

export function formatUsageDate(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAYS_JA[date.getUTCDay()];
  return `${y}年${m}月${d}日(${weekday})`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}〜${formatTime(end)}`;
}

export function formatTime(time: string): string {
  // time: "HH:MM:SS" -> "HH:MM"
  return time.slice(0, 5);
}

export function todayDateStringJST(): string {
  // JST（日本時間）での「今日」の日付文字列 YYYY-MM-DD を返す
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}
