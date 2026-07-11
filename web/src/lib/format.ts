export function formatDuration(totalSeconds?: number) {
  if (!totalSeconds || totalSeconds < 0) return "--";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDateTime(value?: string | number | Date) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatRelativeTime(value?: string | number | Date) {
  if (!value) return "--";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "--";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function isRecentlyOnline(value?: string, thresholdMs = 80_000) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return !Number.isNaN(timestamp) && Date.now() - timestamp < thresholdMs;
}

export function formatCoordinate(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value).toLocaleString()
    : "--";
}

export function formatCompact(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat(undefined, { notation: "compact" }).format(value)
    : "--";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}
