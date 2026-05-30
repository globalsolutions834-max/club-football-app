import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CompetitionsClient from "@/components/competitions/CompetitionsClient"

export default async function CompetitionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const { data: competitions } = await supabase
    .from("competitions").select("*").order("date", { ascending: false })

  return (
    <CompetitionsClient
      competitions={competitions ?? []}
      canEdit={["admin","staff"].includes(profile?.role ?? "")}
      userId={user.id}
    />
  )
}
