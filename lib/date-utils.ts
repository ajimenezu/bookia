export const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function getWeekRange(weekOffset: number) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Find Monday of the current week
  // If today is Sunday (0), we want to go back 6 days to Monday
  // If today is Monday (1), we stay put (0 days diff)
  // If today is Tuesday (2), we go back 1 day
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const dates = weekDays.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      label,
      day: date.getDate(),
      month: date.toLocaleDateString("es-ES", { month: "short" }),
      fullDate: date,
      isToday: date.toDateString() === now.toDateString()
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
 * @param selectedDate The date to calculate the offset for.
 * @returns The number of weeks between the current week and the selected date's week.
 */
export function getWeekOffset(selectedDate: Date) {
  const now = new Date();
  
  // Normalize both dates to the Monday of their respective weeks
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const currentMonday = getMonday(now);
  const selectedMonday = getMonday(selectedDate);
  
  // Calculate the difference in weeks
  const diffInMs = selectedMonday.getTime() - currentMonday.getTime();
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  
  return Math.round(diffInMs / msInWeek);
}
