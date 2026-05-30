import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EvaluationsClient from "@/components/evaluations/EvaluationsClient"

export default async function EvaluationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["admin","staff"].includes(profile?.role ?? "")) redirect("/dashboard")

  const now = new Date()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)

  const [{ data: players }, { data: evaluations }] = await Promise.all([
    supabase.from("players").select("id,first_name,last_name,category,position,photo_url")
      .eq("status","actif").order("last_name"),
    supabase.from("evaluations").select("*")
      .eq("year", now.getFullYear()).order("player_id"),
  ])

  return (
    <EvaluationsClient
      players={players ?? []}
      evaluations={evaluations ?? []}
      currentQuarter={quarter}
      currentYear={now.getFullYear()}
      userId={user.id}
    />
  )
}
