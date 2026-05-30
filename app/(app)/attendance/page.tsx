import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AttendanceClient from "@/components/attendance/AttendanceClient"

export default async function AttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["admin","staff"].includes(profile?.role ?? "")) redirect("/dashboard")

  const { data: players } = await supabase
    .from("players").select("id,first_name,last_name,category,position,photo_url")
    .eq("status","actif").order("last_name")

  const today = new Date().toISOString().split("T")[0]
  const { data: todayAttendances } = await supabase
    .from("attendances").select("*")
    .eq("session_date", today)

  // Stats des 30 derniers jours
  const since = new Date(); since.setDate(since.getDate() - 30)
  const { data: recentAtt } = await supabase
    .from("attendances").select("player_id,status")
    .gte("session_date", since.toISOString().split("T")[0])

  const playerStats = players?.map(p => {
    const pAtt = recentAtt?.filter(a => a.player_id === p.id) ?? []
    const rate  = pAtt.length ? Math.round((pAtt.filter(a => a.status === "P").length / pAtt.length) * 100) : null
    return { ...p, rate }
  })

  return (
    <AttendanceClient
      players={playerStats ?? []}
      todayAttendances={todayAttendances ?? []}
      today={today}
      userId={user.id}
    />
  )
}
