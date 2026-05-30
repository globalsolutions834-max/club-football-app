import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UsersClient from "@/components/users/UsersClient"

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: profiles } = await supabase
    .from("profiles").select("*").order("created_at", { ascending: false })
  const { data: players }  = await supabase
    .from("players").select("id,first_name,last_name").eq("status","actif").order("last_name")

  return <UsersClient profiles={profiles ?? []} players={players ?? []} currentUserId={user.id} />
}
