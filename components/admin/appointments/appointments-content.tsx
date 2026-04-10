import { getAppointmentsInRange } from "@/lib/appointments"
import { getWeekRange } from "@/lib/date-utils"
import { CalendarView } from "./calendar-view"
import { ListView } from "./list-view"

interface AppointmentsContentProps {
  shopId: string
  weekOffset: number
  view: "calendar" | "list"
}

export async function AppointmentsContent({ shopId, weekOffset, view }: AppointmentsContentProps) {
  const { sunday, monday, dates } = getWeekRange(weekOffset)
  // This await triggers the Suspense fallback in the parent page
  const appointments = await getAppointmentsInRange(monday, sunday, shopId)

  return view === "calendar" ? (
    <CalendarView dates={dates} appointments={appointments} shopId={shopId} />
  ) : (
    <ListView appointments={appointments} shopId={shopId} />
  )
}
