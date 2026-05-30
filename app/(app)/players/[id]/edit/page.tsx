import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import PlayerForm from "@/components/players/PlayerForm"

export default async function EditPlayerPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["admin","staff"].includes(profile?.role ?? "")) redirect("/players")
  const { data: player } = await supabase.from("players").select("*").eq("id", params.id).single()
  if (!player) notFound()
  return <PlayerForm player={player} />
}
