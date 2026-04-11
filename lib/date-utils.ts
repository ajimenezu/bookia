export const TIMEZONE = "America/Costa_Rica";

export function toCRDate(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
}

export function fromCRDate(crDate: Date) {
  const year = crDate.getFullYear();
  const month = String(crDate.getMonth() + 1).padStart(2, '0');
  const day = String(crDate.getDate()).padStart(2, '0');
  const hours = String(crDate.getHours()).padStart(2, '0');
  const minutes = String(crDate.getMinutes()).padStart(2, '0');
  const seconds = String(crDate.getSeconds()).padStart(2, '0');
  const ms = String(crDate.getMilliseconds()).padStart(3, '0');
  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`);
}

export const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function getWeekRange(weekOffset: number) {
  const now = new Date();
  const crNow = toCRDate(now);
  const dayOfWeek = crNow.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Find Monday of the current week
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const crMonday = new Date(crNow);
  crMonday.setDate(crNow.getDate() + diffToMonday + weekOffset * 7);
  crMonday.setHours(0, 0, 0, 0);

  const crSunday = new Date(crMonday);
  crSunday.setDate(crMonday.getDate() + 6);
  crSunday.setHours(23, 59, 59, 999);

  const monday = fromCRDate(crMonday);
  const sunday = fromCRDate(crSunday);

  const dates = weekDays.map((label, i) => {
    const d = new Date(crMonday);
    d.setDate(crMonday.getDate() + i);
    return {
      label,
      day: d.getDate(),
      month: d.toLocaleDateString("es-ES", { month: "short" }),
      fullDate: fromCRDate(d), // This returns an absolute date representing that day's CR midnight
      isToday: d.toDateString() === crNow.toDateString()
    };
  });

  return {
    monday,
    sunday,
    dates,
    rangeLabel: `${dates[0].day} ${dates[0].month} - ${dates[6].day} ${dates[6].month}, ${dates[0].fullDate.getFullYear()}`
  };
}

/**
 * Calculates the week offset for a given date relative to the current week.
 * @param selectedDate The absolute date to calculate the offset for.
 * @returns The number of weeks between the current week and the selected date's week in CR time.
 */
export function getWeekOffset(selectedDate: Date) {
  const crNow = toCRDate(new Date());
  const crSelected = toCRDate(selectedDate);
  
  // Normalize both dates to the Monday of their respective weeks
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const currentMonday = getMonday(crNow);
  const selectedMonday = getMonday(crSelected);
  
  // Calculate the difference in weeks
  const diffInMs = selectedMonday.getTime() - currentMonday.getTime();
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  
  return Math.round(diffInMs / msInWeek);
}

/**
 * Formats a Date object as a time string in the America/Costa_Rica timezone.
 */
export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

/**
 * Formats a Date object as a short date string in the America/Costa_Rica timezone.
 */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Combines a date string (YYYY-MM-DD) and a time string (HH:mm) into a Date object
 * and forces it to be interpreted in the America/Costa_Rica timezone.
 */
export function combineDateAndTime(dateStr: string, timeStr: string) {
  if (!timeStr) return new Date(`${dateStr}T00:00:00Z`);
  
  // Ensure HH:mm:ss format
  const parts = timeStr.split(':');
  while (parts.length < 3) {
    parts.push('00');
  }
  const normalizedTime = parts.join(':');
  
  // In Naive Wall Time, we save as UTC to match the intended local time
  return new Date(`${dateStr}T${normalizedTime}Z`);
}
