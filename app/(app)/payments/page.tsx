import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PaymentsClient from "@/components/payments/PaymentsClient"

export default async function PaymentsPage({
  searchParams
}: { searchParams: { month?: string; year?: string; status?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["admin","treasurer"].includes(profile?.role ?? "")) redirect("/dashboard")

  const now   = new Date()
  const month = Number(searchParams.month ?? now.getMonth() + 1)
  const year  = Number(searchParams.year  ?? now.getFullYear())

  const { data: players } = await supabase
    .from("players").select("id,first_name,last_name,category,photo_url,monthly_fee,status")
    .eq("status","actif").order("last_name")

  const { data: payments } = await supabase
    .from("payments").select("*")
    .eq("month", month).eq("year", year)

  // Totaux annuels
  const { data: yearPayments } = await supabase
    .from("payments").select("amount,status,month")
    .eq("year", year)

  return (
    <PaymentsClient
      players={players ?? []}
      payments={payments ?? []}
      yearPayments={yearPayments ?? []}
      month={month} year={year}
      userId={user.id}
      isAdmin={profile?.role === "admin"}
    />
  )
}
