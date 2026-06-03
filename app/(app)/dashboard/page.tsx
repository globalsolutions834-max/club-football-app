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
  
  // SÉCURITÉ : Si le profil n'existe pas en base de données, on empêche le crash et on redirige
  if (!profile) {
    redirect("/login")
  }

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

  const totalCollected = payments?.filter(p => p.status === "payé").reduce((sum, p) => sum + p.amount, 0) || 0
  const lateCount      = payments?.filter(p => p.month === month && p.status === "en_retard").length || 0

  // Taux de présence
  const totalAttendances = attendances?.length || 0
  const presentCount     = attendances?.filter(a => a.status === "présent").length || 0
  const attendanceRate   = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0

  // Données graphiques
  const paymentData = MONTHS.map((m, i) => {
    const collected = payments?.filter(p => p.month === i + 1 && p.status === "payé").reduce((sum, p) => sum + p.amount, 0) || 0
    return { mois: m.substring(0,4), collecté: collected }
  })

  const attendanceData = [
    { semaine: "S1", taux: attendanceRate },
    { semaine: "S2", taux: Math.max(0, attendanceRate - 5) },
    { semaine: "S3", taux: Math.min(100, attendanceRate + 2) },
    { semaine: "S4", taux: attendanceRate },
  ]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-sm text-surface-400 mt-0.5">Ravi de vous revoir, {profile.full_name}</p>
        </div>
        <QuickActions role={profile.role} />
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Joueurs Actifs</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalPlayers || 0}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
            <Coins size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Cotisations Collectées</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(totalCollected)}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Taux de Présence Global</p>
            <p className="text-xl font-bold text-white mt-0.5">{attendanceRate}%</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Retards de Cotisation</p>
            <p className="text-xl font-bold text-white mt-0.5">{lateCount}</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <DashboardCharts paymentData={paymentData} attendanceData={attendanceData} />

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
                  c.result === \"V\" ? \"bg-green-500\" : c.result === \"N\" ? \"bg-surface-500\" : \"bg-red-500\"
                }`}>
                  {c.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}