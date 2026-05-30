"use client"
import { useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import {
  avatarUrl, categoryColor, paymentStatusColor, paymentStatusLabel,
  formatCurrency, MONTHS, MONTHS_FULL, cn
} from "@/lib/utils"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Coins, TrendingUp, AlertTriangle, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Player = { id: string; first_name: string; last_name: string; category: string; photo_url?: string; monthly_fee: number }
type Payment = { id: string; player_id: string; month: number; year: number; amount: number; status: string; paid_date?: string }

export default function PaymentsClient({
  players, payments, yearPayments, month, year, userId, isAdmin
}: {
  players: Player[]; payments: Payment[]; yearPayments: any[]
  month: number; year: number; userId: string; isAdmin: boolean
}) {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter]  = useState("")

  function navigate(m: number, y: number) {
    router.push(`/payments?month=${m}&year=${y}`)
  }
  function prevMonth() {
    if (month === 1) navigate(12, year - 1)
    else navigate(month - 1, year)
  }
  function nextMonth() {
    if (month === 12) navigate(1, year + 1)
    else navigate(month + 1, year)
  }

  // Fusion joueurs + paiements du mois
  const rows = useMemo(() =>
    players
      .filter(p => filter === "" || `${p.first_name} ${p.last_name}`.toLowerCase().includes(filter.toLowerCase()))
      .map(p => {
        const pay = payments.find(x => x.player_id === p.id)
        return { player: p, payment: pay ?? null }
      }), [players, payments, filter]
  )

  // Totaux mois
  const totalDue       = players.reduce((s, p) => s + p.monthly_fee, 0)
  const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0)
  const lateCount      = payments.filter(p => p.status === "late").length
  const paidCount      = payments.filter(p => p.status === "paid").length

  // Graphique annuel
  const annualData = MONTHS.map((m, i) => ({
    mois: m,
    collecté: yearPayments.filter(p => p.month === i + 1 && p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0),
  }))

  async function markPaid(playerId: string, fee: number) {
    setLoading(playerId)
    try {
      await supabase.from("payments").upsert({
        player_id: playerId, month, year, amount: fee,
        status: "paid", paid_date: new Date().toISOString().split("T")[0],
        created_by: userId,
      }, { onConflict: "player_id,month,year" })
      toast.success("Paiement enregistré")
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(null) }
  }

  async function markLate(playerId: string, fee: number) {
    setLoading(playerId)
    try {
      await supabase.from("payments").upsert({
        player_id: playerId, month, year, amount: fee,
        status: "late", created_by: userId,
      }, { onConflict: "player_id,month,year" })
      toast.success("Marqué en retard")
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(null) }
  }

  async function removePay(payId: string) {
    setLoading(payId)
    try {
      await supabase.from("payments").delete().eq("id", payId)
      toast.success("Paiement supprimé")
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(null) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cotisations</h1>
          <p className="text-surface-500 text-sm">Suivi des paiements mensuels</p>
        </div>
        {/* Navigation mois */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-secondary px-2 py-2"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-surface-800 min-w-28 text-center">
            {MONTHS_FULL[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="btn-secondary px-2 py-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total dû",        val: formatCurrency(totalDue),       icon: Coins,          color: "text-surface-600", bg: "bg-surface-100" },
          { label: "Collecté",        val: formatCurrency(totalCollected),  icon: CheckCircle,    color: "text-green-700",   bg: "bg-green-100"   },
          { label: "Payés",           val: `${paidCount} / ${players.length}`, icon: TrendingUp,  color: "text-blue-700",    bg: "bg-blue-100"    },
          { label: "En retard",       val: lateCount,                       icon: AlertTriangle,  color: "text-red-700",     bg: "bg-red-100"     },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className={`card p-4 flex items-center gap-3 ${bg} border-0`}>
            <div className={`w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={`text-lg font-bold ${color}`}>{val}</p>
              <p className={`text-xs ${color} opacity-70`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table joueurs */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex items-center gap-3">
            <input value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Rechercher un joueur…" className="input-field flex-1" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Joueur</th>
                  <th className="th text-center">Montant</th>
                  <th className="th text-center">Statut</th>
                  {isAdmin && <th className="th text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ player: p, payment }) => (
                  <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Image
                          src={avatarUrl(p.first_name, p.last_name, p.photo_url)}
                          alt="" width={36} height={36}
                          className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-surface-800">{p.last_name} {p.first_name}</p>
                          <span className={cn("badge text-[10px]", categoryColor(p.category))}>{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td text-center">
                      <span className="text-sm font-semibold text-surface-700">
                        {(payment?.amount ?? p.monthly_fee).toLocaleString("fr-FR")} F
                      </span>
                    </td>
                    <td className="td text-center">
                      <span className={cn("badge border", paymentStatusColor(payment?.status ?? "pending"))}>
                        {paymentStatusLabel(payment?.status ?? "pending")}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="td text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {loading === p.id || loading === payment?.id
                            ? <Loader2 size={14} className="animate-spin text-surface-400" />
                            : <>
                                {payment?.status !== "paid" && (
                                  <button onClick={() => markPaid(p.id, p.monthly_fee)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors" title="Marquer payé">
                                    <CheckCircle size={13} />
                                  </button>
                                )}
                                {payment?.status !== "late" && (
                                  <button onClick={() => markLate(p.id, p.monthly_fee)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors" title="Marquer en retard">
                                    <XCircle size={13} />
                                  </button>
                                )}
                                {payment && (
                                  <button onClick={() => removePay(payment.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-500 transition-colors" title="Effacer">
                                    <Clock size={13} />
                                  </button>
                                )}
                              </>
                          }
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Graphique annuel */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-4">Collecte annuelle {year}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={annualData} barSize={16} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#6c757d" }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v/1000}k`} />
              <YAxis type="category" dataKey="mois" tick={{ fontSize: 11, fill: "#6c757d" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), "Collecté"]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 12 }}
              />
              <Bar dataKey="collecté" fill="#2e8b57" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t border-surface-100">
            <div className="flex justify-between items-center">
              <p className="text-xs text-surface-500">Total annuel collecté</p>
              <p className="text-sm font-bold text-brand-600">
                {formatCurrency(annualData.reduce((s, d) => s + d.collecté, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
