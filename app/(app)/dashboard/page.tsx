import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatCurrency, MONTHS } from "@/lib/utils"
import { Users, TrendingUp, Coins, AlertTriangle, Calendar, Trophy } from "lucide-react"
import DashboardCharts from "@/components/dashboard/DashboardCharts"
import RecentAlerts from "@/components/dashboard/RecentAlerts"
import QuickActions from "@/components/dashboard/QuickActions"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // Stats parallèles
  const [
    { count: totalPlayers },
    { data: payments },
    { data: attendances },
    { data: recentCompetitions },
  ] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }).eq("status", "actif"),
    supabase.from("payments").select("amount,status,month,year").eq("year", year),
    supabase.from("attendances").select("status,session_date").gte("session_date", `${year}-01-01`),
    supabase.from("competitions").select("*").order("date", { ascending: false }).limit(3),
  ])

  const totalCollected = payments?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0
  const lateCount      = payments?.filter(p => p.status === "late").length ?? 0
  const presentCount   = attendances?.filter(a => a.status === "P").length ?? 0
  const totalAtt       = attendances?.length ?? 1
  const avgAttendance  = Math.round((presentCount / totalAtt) * 100)

  // Données graphique cotisations par mois
  const paymentByMonth = MONTHS.map((m, i) => ({
    mois: m,
    collecté: payments?.filter(p => p.month === i + 1 && p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0,
  }))

  // Données graphique présences 4 dernières semaines
  const attendanceByWeek = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (7 * (7 - i)))
    const dateStr = d.toISOString().split("T")[0]
    const weekAtt = attendances?.filter(a => a.session_date === dateStr) ?? []
    const pct = weekAtt.length ? Math.round((weekAtt.filter(a => a.status === "P").length / weekAtt.length) * 100) : 0
    return { semaine: `S${i + 1}`, taux: pct }
  })

  const stats = [
    { label: "Joueurs actifs",    value: totalPlayers ?? 0,          icon: Users,          color: "text-brand-600",  bg: "bg-brand-50",  suffix: "" },
    { label: "Taux de présence",  value: avgAttendance,              icon: TrendingUp,      color: "text-blue-600",   bg: "bg-blue-50",   suffix: "%" },
    { label: "Collecté en " + year, value: formatCurrency(totalCollected), icon: Coins,   color: "text-green-600",  bg: "bg-green-50",  suffix: "", raw: true },
    { label: "Retards cotisation", value: lateCount,                 icon: AlertTriangle,   color: "text-red-600",    bg: "bg-red-50",    suffix: "" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Tableau de bord</h1>
          <p className="text-surface-500 text-sm mt-0.5">
            Bonjour {profile?.full_name?.split(" ")[0]} — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <QuickActions role={profile?.role} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, suffix, raw }) => (
          <div key={label} className="stat-card hover:shadow-card-hover transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-surface-500">{label}</span>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {raw ? value : `${value}${suffix}`}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts paymentData={paymentByMonth} attendanceData={attendanceByWeek} />

      {/* Bas de page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertes */}
        <div className="lg:col-span-2">
          <RecentAlerts lateCount={lateCount} role={profile?.role} />
        </div>

        {/* Dernières compétitions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-brand-600" />
            <h3 className="font-semibold text-surface-800 text-sm">Derniers résultats</h3>
          </div>
          {recentCompetitions?.length === 0 && (
            <p className="text-surface-400 text-sm text-center py-4">Aucun match enregistré</p>
          )}
          <div className="space-y-3">
            {recentCompetitions?.map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-800">{c.name}</p>
                  <p className="text-xs text-surface-400">{c.opponent} · {new Date(c.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                  c.result === "V" ? "bg-green-500" : c.result === "N" ? "bg-yellow-500" : "bg-red-500"
                }`}>
                  {c.result ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
