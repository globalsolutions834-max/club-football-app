import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PlayerForm from "@/components/players/PlayerForm"

export default async function NewPlayerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["admin","staff"].includes(profile?.role ?? "")) redirect("/players")
  return <PlayerForm />
}
