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
